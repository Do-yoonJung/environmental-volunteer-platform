const chai = require('chai');
const chaiHttp = require('chai-http');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');

const app = require('../server');

const User = require('../models/User');
const Event = require('../models/Event');
const Attendance = require('../models/Attendance');
const Feedback = require('../models/Feedback');

chai.use(chaiHttp);

const { expect } = chai;

describe('Epic 4 Event Feedback and Rating Functional Tests', () => {
    const volunteerId = '64b000000000000000000001';
    const otherVolunteerId = '64b000000000000000000002';
    const coordinatorId = '64b000000000000000000003';
    const otherCoordinatorId = '64b000000000000000000004';
    const eventId = '64b000000000000000000005';
    const feedbackId = '64b000000000000000000006';

    before(() => {
        process.env.JWT_SECRET = 'feedback-test-secret';
    });

    afterEach(() => {
        sinon.restore();
    });

    const tokenFor = (id) =>
        jwt.sign(
            { id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

    const mockAuthenticatedUser = (user) => {
        sinon.stub(User, 'findById').returns({
            select: sinon.stub().resolves(user)
        });
    };

    it('Story 7: allows an eligible present volunteer to submit feedback', async () => {
        const volunteer = {
            _id: volunteerId,
            id: volunteerId,
            role: 'volunteer'
        };

        mockAuthenticatedUser(volunteer);

        sinon.stub(Attendance, 'findOne').resolves({
            eventId,
            volunteerId,
            status: 'present'
        });

        sinon.stub(Event, 'findById').resolves({
            _id: eventId,
            title: 'Park Cleanup'
        });

        sinon.stub(Feedback, 'findOne').resolves(null);

        sinon.stub(Feedback, 'create').resolves({
            _id: feedbackId,
            eventId,
            volunteerId,
            rating: 5,
            comment: 'Excellent event'
        });

        const response = await chai
            .request(app)
            .post(`/api/feedback/${eventId}`)
            .set(
                'Authorization',
                `Bearer ${tokenFor(volunteerId)}`
            )
            .send({
                rating: 5,
                comment: 'Excellent event'
            });

        expect(response).to.have.status(201);
        expect(response.body.message)
            .to.equal('Feedback submitted successfully');
        expect(response.body.feedback.rating).to.equal(5);
        expect(response.body.feedback.comment)
            .to.equal('Excellent event');
    });

    it('Story 7: rejects a rating outside the permitted range', async () => {
        const volunteer = {
            _id: volunteerId,
            id: volunteerId,
            role: 'volunteer'
        };

        mockAuthenticatedUser(volunteer);

        sinon.stub(Attendance, 'findOne').resolves({
            eventId,
            volunteerId,
            status: 'present'
        });

        const response = await chai
            .request(app)
            .post(`/api/feedback/${eventId}`)
            .set(
                'Authorization',
                `Bearer ${tokenFor(volunteerId)}`
            )
            .send({
                rating: 6,
                comment: 'Invalid rating'
            });

        expect(response).to.have.status(400);
        expect(response.body.message)
            .to.equal(
                'Rating must be an integer between 1 and 5'
            );
    });

    it('Story 7: rejects feedback when the volunteer was not present', async () => {
        const volunteer = {
            _id: volunteerId,
            id: volunteerId,
            role: 'volunteer'
        };

        mockAuthenticatedUser(volunteer);

        sinon.stub(Attendance, 'findOne').resolves(null);

        const response = await chai
            .request(app)
            .post(`/api/feedback/${eventId}`)
            .set(
                'Authorization',
                `Bearer ${tokenFor(volunteerId)}`
            )
            .send({
                rating: 4,
                comment: 'Testing eligibility'
            });

        expect(response).to.have.status(403);
        expect(response.body.message)
            .to.equal(
                'You can only submit feedback for events you attended'
            );
    });

    it('Story 7: prevents duplicate feedback for the same event', async () => {
        const volunteer = {
            _id: volunteerId,
            id: volunteerId,
            role: 'volunteer'
        };

        mockAuthenticatedUser(volunteer);

        sinon.stub(Attendance, 'findOne').resolves({
            eventId,
            volunteerId,
            status: 'present'
        });

        sinon.stub(Event, 'findById').resolves({
            _id: eventId,
            title: 'Park Cleanup'
        });

        sinon.stub(Feedback, 'findOne').resolves({
            _id: feedbackId,
            eventId,
            volunteerId
        });

        const response = await chai
            .request(app)
            .post(`/api/feedback/${eventId}`)
            .set(
                'Authorization',
                `Bearer ${tokenFor(volunteerId)}`
            )
            .send({
                rating: 4,
                comment: 'Duplicate attempt'
            });

        expect(response).to.have.status(400);
        expect(response.body.message)
            .to.equal(
                'You have already submitted feedback for this event'
            );
    });

    it('Story 8: allows the managing coordinator to view event feedback', async () => {
        const coordinator = {
            _id: coordinatorId,
            id: coordinatorId,
            role: 'coordinator'
        };

        mockAuthenticatedUser(coordinator);

        sinon.stub(Event, 'findById').resolves({
            _id: eventId,
            title: 'Park Cleanup',
            userId: coordinatorId
        });

        const feedbackRecords = [
            {
                _id: feedbackId,
                eventId,
                volunteerId,
                rating: 5,
                comment: 'Excellent event'
            }
        ];

        const sort = sinon.stub().resolves(feedbackRecords);
        const populate = sinon.stub().returns({ sort });

        sinon.stub(Feedback, 'find').returns({
            populate
        });

        const response = await chai
            .request(app)
            .get(`/api/feedback/event/${eventId}`)
            .set(
                'Authorization',
                `Bearer ${tokenFor(coordinatorId)}`
            );

        expect(response).to.have.status(200);
        expect(response.body.event.title)
            .to.equal('Park Cleanup');
        expect(response.body.feedback)
            .to.have.lengthOf(1);
        expect(response.body.feedback[0].rating)
            .to.equal(5);
    });

    it('Story 8: rejects a coordinator who does not manage the event', async () => {
        const otherCoordinator = {
            _id: otherCoordinatorId,
            id: otherCoordinatorId,
            role: 'coordinator'
        };

        mockAuthenticatedUser(otherCoordinator);

        sinon.stub(Event, 'findById').resolves({
            _id: eventId,
            title: 'Park Cleanup',
            userId: coordinatorId
        });

        const response = await chai
            .request(app)
            .get(`/api/feedback/event/${eventId}`)
            .set(
                'Authorization',
                `Bearer ${tokenFor(otherCoordinatorId)}`
            );

        expect(response).to.have.status(403);
        expect(response.body.message)
            .to.equal(
                'You can only view feedback for events you manage'
            );
    });

    it('Story 9: allows the owner to update feedback without creating a duplicate', async () => {
        const volunteer = {
            _id: volunteerId,
            id: volunteerId,
            role: 'volunteer'
        };

        mockAuthenticatedUser(volunteer);

        const existingFeedback = {
            _id: feedbackId,
            eventId,
            volunteerId,
            rating: 3,
            comment: 'Original comment',
            save: sinon.stub().resolves()
        };

        sinon.stub(Feedback, 'findById')
            .resolves(existingFeedback);

        const response = await chai
            .request(app)
            .put(`/api/feedback/${feedbackId}`)
            .set(
                'Authorization',
                `Bearer ${tokenFor(volunteerId)}`
            )
            .send({
                rating: 5,
                comment: 'Updated comment'
            });

        expect(response).to.have.status(200);
        expect(response.body.message)
            .to.equal('Feedback updated successfully');
        expect(response.body.feedback.rating).to.equal(5);
        expect(response.body.feedback.comment)
            .to.equal('Updated comment');
        expect(existingFeedback.save.calledOnce)
            .to.equal(true);
    });

    it('Story 9: rejects an update by a volunteer who does not own the feedback', async () => {
        const otherVolunteer = {
            _id: otherVolunteerId,
            id: otherVolunteerId,
            role: 'volunteer'
        };

        mockAuthenticatedUser(otherVolunteer);

        sinon.stub(Feedback, 'findById').resolves({
            _id: feedbackId,
            eventId,
            volunteerId,
            rating: 3,
            comment: 'Original comment'
        });

        const response = await chai
            .request(app)
            .put(`/api/feedback/${feedbackId}`)
            .set(
                'Authorization',
                `Bearer ${tokenFor(otherVolunteerId)}`
            )
            .send({
                rating: 5,
                comment: 'Unauthorised update'
            });

        expect(response).to.have.status(403);
        expect(response.body.message)
            .to.equal(
                'You can only update your own feedback'
            );
    });
});