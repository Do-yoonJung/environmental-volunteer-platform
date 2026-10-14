require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Feedback = require('../models/Feedback');

mongoose.set('strictQuery', true);

const BASE_URL =
    process.env.NFR_BASE_URL ||
    'http://JessLoadBalancer-89094527.ap-southeast-2.elb.amazonaws.com';

const REQUEST_COUNT = 10;
const THRESHOLD_MS = 2000;
const VOLUNTEER_COUNT = 100;

const runId = Date.now().toString();

let coordinatorId = null;
let eventId = null;
let volunteerIds = [];


async function cleanup() {
    if (eventId) {
        await Feedback.deleteMany({
            eventId
        });

        await Registration.deleteMany({
            eventId
        });

        await Event.deleteOne({
            _id: eventId
        });
    }

    if (volunteerIds.length > 0) {
        await User.deleteMany({
            _id: {
                $in: volunteerIds
            }
        });
    }

    if (coordinatorId) {
        await User.deleteOne({
            _id: coordinatorId
        });
    }
}


async function run() {
    try {
        console.log('');
        console.log(
            '=============================================='
        );
        console.log(
            'NFR-RA-01 - Analytics Response-Time Test'
        );
        console.log(
            '=============================================='
        );
        console.log('');

        await mongoose.connect(
            process.env.MONGO_URI,
            {
                dbName: 'evp_a2'
            }
        );

        console.log(
            `MongoDB connection: OK (${mongoose.connection.name})`
        );

        const coordinatorPassword =
            crypto.randomBytes(16).toString('hex');

        const coordinator =
            await User.create({
                name:
                    'NFR Performance Coordinator',

                email:
                    `nfr-coordinator-${runId}@example.com`,

                password:
                    coordinatorPassword,

                role:
                    'coordinator'
            });

        coordinatorId =
            coordinator._id;

        const event =
            await Event.create({
                userId:
                    coordinator._id,

                title:
                    `NFR-RA-01 Performance Test ${runId}`,

                description:
                    'Temporary event for NFR performance testing'
            });

        eventId =
            event._id;

        // Separate volunteers are required because registrations and feedback
        // use unique event-volunteer combinations.
        const volunteerPasswordHash =
            await bcrypt.hash(
                crypto.randomBytes(16)
                    .toString('hex'),
                10
            );

        const volunteerData =
            Array.from(
                {
                    length:
                        VOLUNTEER_COUNT
                },

                (_, index) => ({
                    name:
                        `NFR Volunteer ${index + 1}`,

                    email:
                        `nfr-volunteer-${runId}-${index + 1}@example.com`,

                    password:
                        volunteerPasswordHash,

                    role:
                        'volunteer'
                })
            );

        const volunteers =
            await User.insertMany(
                volunteerData
            );

        volunteerIds =
            volunteers.map(
                volunteer =>
                    volunteer._id
            );

        const registrationData =
            volunteers.map(
                volunteer => ({
                    eventId:
                        event._id,

                    volunteerId:
                        volunteer._id,

                    status:
                        'registered'
                })
            );

        await Registration.insertMany(
            registrationData
        );

        const feedbackData =
            volunteers.map(
                (volunteer, index) => ({
                    eventId:
                        event._id,

                    volunteerId:
                        volunteer._id,

                    rating:
                        (index % 5) + 1,

                    comment:
                        'NFR performance test feedback'
                })
            );

        await Feedback.insertMany(
            feedbackData
        );

        const registrationCount =
            await Registration.countDocuments({
                eventId:
                    event._id,

                status:
                    'registered'
            });

        const feedbackCount =
            await Feedback.countDocuments({
                eventId:
                    event._id
            });

        console.log('');
        console.log('Test data created:');

        console.log(
            `Registrations: ${registrationCount}`
        );

        console.log(
            `Feedback submissions: ${feedbackCount}`
        );

        console.log('');

        if (
            registrationCount !== 100 ||
            feedbackCount !== 100
        ) {
            throw new Error(
                'Test dataset does not contain exactly 100 registrations and 100 feedback submissions.'
            );
        }

        const loginResponse =
            await fetch(
                `${BASE_URL}/api/auth/login`,
                {
                    method:
                        'POST',

                    headers: {
                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            email:
                                coordinator.email,

                            password:
                                coordinatorPassword
                        })
                }
            );

        if (!loginResponse.ok) {
            throw new Error(
                `Coordinator login failed with HTTP ${loginResponse.status}`
            );
        }

        const loginData =
            await loginResponse.json();

        const token =
            loginData.token;

        if (!token) {
            throw new Error(
                'Login response did not contain a JWT token.'
            );
        }

        console.log(
            'Coordinator authentication: OK'
        );

        console.log('');

        console.log(
            `Requests: ${REQUEST_COUNT} sequential requests`
        );

        console.log(
            'Concurrent users: 1'
        );

        console.log(
            `Threshold: < ${THRESHOLD_MS} ms`
        );

        console.log('');

        const results = [];

        for (
            let i = 1;
            i <= REQUEST_COUNT;
            i += 1
        ) {
            const start =
                process.hrtime.bigint();

            const response =
                await fetch(
                    `${BASE_URL}/api/analytics/event/${event._id}`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            const data =
                await response.json();

            const end =
                process.hrtime.bigint();

            const durationMs =
                Number(
                    end - start
                ) / 1_000_000;

            const responseCorrect =
                response.status === 200 &&
                data.attendance &&
                data.attendance.registered === 100 &&
                data.feedback &&
                data.feedback.feedbackCount === 100;

            const passed =
                responseCorrect &&
                durationMs < THRESHOLD_MS;

            results.push({
                durationMs,
                passed
            });

            console.log(
                `Request ${String(i).padStart(2, '0')}: ` +
                `${durationMs.toFixed(2)} ms  ` +
                `${passed ? 'PASS' : 'FAIL'}`
            );
        }

        const passing =
            results.filter(
                result =>
                    result.passed
            ).length;

        const average =
            results.reduce(
                (
                    total,
                    result
                ) =>
                    total +
                    result.durationMs,
                0
            ) /
            results.length;

        const maximum =
            Math.max(
                ...results.map(
                    result =>
                        result.durationMs
                )
            );

        console.log('');

        console.log(
            '----------------------------------------------'
        );

        console.log(
            'Performance Summary'
        );

        console.log(
            '----------------------------------------------'
        );

        console.log(
            `Average response time: ${average.toFixed(2)} ms`
        );

        console.log(
            `Maximum response time: ${maximum.toFixed(2)} ms`
        );

        console.log(
            `Requests below 2000 ms: ${passing}/${REQUEST_COUNT}`
        );

        console.log('');

        if (
            passing === REQUEST_COUNT
        ) {
            console.log(
                'NFR-RA-01 Result: PASS'
            );

            console.log(
                'All 10 sequential requests completed in under 2 seconds.'
            );
        } else {
            console.log(
                'NFR-RA-01 Result: FAIL'
            );

            console.log(
                `${REQUEST_COUNT - passing} request(s) did not meet the requirement.`
            );

            process.exitCode = 1;
        }

        console.log('');

    } catch (error) {
        console.error('');

        console.error(
            'NFR-RA-01 Result: ERROR'
        );

        console.error(
            error.message
        );

        process.exitCode = 1;

    } finally {
        try {
            console.log(
                'Cleaning up temporary test data...'
            );

            await cleanup();

            console.log(
                'Temporary test data removed.'
            );

        } catch (cleanupError) {
            console.error(
                `Cleanup warning: ${cleanupError.message}`
            );

            process.exitCode = 1;
        }

        await mongoose.disconnect();
    }
}


run();