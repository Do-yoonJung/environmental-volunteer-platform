const assert = require('assert');

const AttendanceAnalytics =
    require('../services/analytics/AttendanceAnalytics');
const FeedbackAnalytics =
    require('../services/analytics/FeedbackAnalytics');
const AnalyticsFactory =
    require('../services/analytics/AnalyticsFactory');
const AnalyticsService =
    require('../services/AnalyticsService');

const Registration =
    require('../models/Registration');
const Attendance =
    require('../models/Attendance');
const Feedback =
    require('../models/Feedback');
const Event =
    require('../models/Event');

const {
    analyticsAccess
} = require('../middleware/analyticsAccessMiddleware');


describe('Story 10 - Coordinator Analytics', () => {

    let originalRegistrationCountDocuments;
    let originalAttendanceCountDocuments;
    let originalFeedbackFind;
    let originalEventFindById;
    let originalFactoryCreate;

    beforeEach(() => {
        originalRegistrationCountDocuments =
            Registration.countDocuments;

        originalAttendanceCountDocuments =
            Attendance.countDocuments;

        originalFeedbackFind =
            Feedback.find;

        originalEventFindById =
            Event.findById;

        originalFactoryCreate =
            AnalyticsFactory.create;
    });

    afterEach(() => {
        Registration.countDocuments =
            originalRegistrationCountDocuments;

        Attendance.countDocuments =
            originalAttendanceCountDocuments;

        Feedback.find =
            originalFeedbackFind;

        Event.findById =
            originalEventFindById;

        AnalyticsFactory.create =
            originalFactoryCreate;
    });


    describe('FR-RA-01 - Attendance analytics', () => {

        it('calculates registered, present, absent and attendance rate correctly', async () => {
            Registration.countDocuments =
                async ({ status }) => {
                    assert.strictEqual(
                        status,
                        'registered'
                    );

                    return 4;
                };

            Attendance.countDocuments =
                async ({ status }) => {
                    if (status === 'present') {
                        return 3;
                    }

                    if (status === 'absent') {
                        return 1;
                    }

                    return 0;
                };

            const analytics =
                new AttendanceAnalytics();

            const result =
                await analytics.calculate(
                    'event-123'
                );

            assert.deepStrictEqual(
                result,
                {
                    registered: 4,
                    present: 3,
                    absent: 1,
                    attendanceRate: 75,
                    hasAttendanceData: true
                }
            );
        });


        it('handles an event with no registrations or attendance data', async () => {
            Registration.countDocuments =
                async () => 0;

            Attendance.countDocuments =
                async () => 0;

            const analytics =
                new AttendanceAnalytics();

            const result =
                await analytics.calculate(
                    'event-123'
                );

            assert.deepStrictEqual(
                result,
                {
                    registered: 0,
                    present: 0,
                    absent: 0,
                    attendanceRate: null,
                    hasAttendanceData: false
                }
            );
        });

    });


    describe('FR-RA-02 - Feedback analytics', () => {

        it('calculates feedback count and average rating correctly', async () => {
            Feedback.find = () => ({
                select: async () => [
                    { rating: 5 },
                    { rating: 4 },
                    { rating: 3 }
                ]
            });

            const analytics =
                new FeedbackAnalytics();

            const result =
                await analytics.calculate(
                    'event-123'
                );

            assert.deepStrictEqual(
                result,
                {
                    feedbackCount: 3,
                    averageRating: 4,
                    hasFeedbackData: true
                }
            );
        });


        it('handles an event with no feedback submissions', async () => {
            Feedback.find = () => ({
                select: async () => []
            });

            const analytics =
                new FeedbackAnalytics();

            const result =
                await analytics.calculate(
                    'event-123'
                );

            assert.deepStrictEqual(
                result,
                {
                    feedbackCount: 0,
                    averageRating: null,
                    hasFeedbackData: false
                }
            );
        });

    });


    describe('Analytics service integration', () => {

        it('combines attendance and feedback analytics into one event summary', async () => {
            const requestedTypes = [];

            AnalyticsFactory.create =
                (type) => {
                    requestedTypes.push(type);

                    if (type === 'attendance') {
                        return {
                            async calculate(eventId) {
                                assert.strictEqual(
                                    eventId,
                                    'event-123'
                                );

                                return {
                                    registered: 2,
                                    present: 1,
                                    absent: 1,
                                    attendanceRate: 50,
                                    hasAttendanceData: true
                                };
                            }
                        };
                    }

                    if (type === 'feedback') {
                        return {
                            async calculate(eventId) {
                                assert.strictEqual(
                                    eventId,
                                    'event-123'
                                );

                                return {
                                    feedbackCount: 1,
                                    averageRating: 4,
                                    hasFeedbackData: true
                                };
                            }
                        };
                    }

                    throw new Error(
                        'Unexpected analytics type'
                    );
                };

            const result =
                await AnalyticsService
                    .getEventSummary(
                        'event-123'
                    );

            assert.deepStrictEqual(
                requestedTypes,
                [
                    'attendance',
                    'feedback'
                ]
            );

            assert.strictEqual(
                result.attendance.attendanceRate,
                50
            );

            assert.strictEqual(
                result.feedback.averageRating,
                4
            );
        });

    });


    describe('Coordinator analytics access control', () => {

        const createResponse = () => ({
            statusCode: 200,
            body: null,

            status(code) {
                this.statusCode = code;
                return this;
            },

            json(payload) {
                this.body = payload;
                return this;
            }
        });


        it('rejects unauthenticated access with 401', async () => {
            const req = {
                params: {
                    eventId: 'event-123'
                }
            };

            const res =
                createResponse();

            let nextCalled = false;

            await analyticsAccess(
                req,
                res,
                () => {
                    nextCalled = true;
                }
            );

            assert.strictEqual(
                res.statusCode,
                401
            );

            assert.strictEqual(
                nextCalled,
                false
            );
        });


        it('rejects non-coordinator access with 403', async () => {
            const req = {
                params: {
                    eventId: 'event-123'
                },

                user: {
                    id: 'volunteer-1',
                    role: 'volunteer'
                }
            };

            const res =
                createResponse();

            let nextCalled = false;

            await analyticsAccess(
                req,
                res,
                () => {
                    nextCalled = true;
                }
            );

            assert.strictEqual(
                res.statusCode,
                403
            );

            assert.strictEqual(
                nextCalled,
                false
            );
        });


        it('returns 404 when the event does not exist', async () => {
            Event.findById =
                async () => null;

            const req = {
                params: {
                    eventId: 'missing-event'
                },

                user: {
                    id: 'coordinator-1',
                    role: 'coordinator'
                }
            };

            const res =
                createResponse();

            let nextCalled = false;

            await analyticsAccess(
                req,
                res,
                () => {
                    nextCalled = true;
                }
            );

            assert.strictEqual(
                res.statusCode,
                404
            );

            assert.strictEqual(
                nextCalled,
                false
            );
        });


        it('rejects a coordinator viewing another coordinators event', async () => {
            Event.findById =
                async () => ({
                    _id: 'event-123',

                    userId: {
                        toString: () =>
                            'coordinator-2'
                    }
                });

            const req = {
                params: {
                    eventId: 'event-123'
                },

                user: {
                    id: 'coordinator-1',
                    role: 'coordinator'
                }
            };

            const res =
                createResponse();

            let nextCalled = false;

            await analyticsAccess(
                req,
                res,
                () => {
                    nextCalled = true;
                }
            );

            assert.strictEqual(
                res.statusCode,
                403
            );

            assert.strictEqual(
                nextCalled,
                false
            );
        });


        it('allows the coordinator who manages the event to continue', async () => {
            const event = {
                _id: 'event-123',
                title: 'Park Cleanup',

                userId: {
                    toString: () =>
                        'coordinator-1'
                }
            };

            Event.findById =
                async () => event;

            const req = {
                params: {
                    eventId: 'event-123'
                },

                user: {
                    id: 'coordinator-1',
                    role: 'coordinator'
                }
            };

            const res =
                createResponse();

            let nextCalled = false;

            await analyticsAccess(
                req,
                res,
                () => {
                    nextCalled = true;
                }
            );

            assert.strictEqual(
                nextCalled,
                true
            );

            assert.strictEqual(
                req.analyticsEvent,
                event
            );
        });

    });

});