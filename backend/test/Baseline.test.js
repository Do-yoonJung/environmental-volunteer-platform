const assert = require('assert');

const User = require('../models/User');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Attendance = require('../models/Attendance');

const { registerUser } = require('../controllers/authController');
const { updateEvent } = require('../controllers/eventController');
const {
  registerForEvent,
  cancelRegistration
} = require('../controllers/registrationController');
const { coordinatorOnly } = require('../middleware/authMiddleware');
const attendanceFacade = require('../services/AttendanceFacade');

const createResponse = () => {
  const res = {
    statusCode: 200,
    body: undefined,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(payload) {
      this.body = payload;
      return this;
    }
  };

  return res;
};

describe('Epic 1 - Baseline Functionality', () => {
  const originals = {};

  beforeEach(() => {
    originals.userFindOne = User.findOne;
    originals.userCreate = User.create;
    originals.eventFindById = Event.findById;
    originals.registrationFindOne = Registration.findOne;
    originals.registrationCreate = Registration.create;
    originals.registrationFind = Registration.find;
    originals.attendanceFind = Attendance.find;

    process.env.JWT_SECRET =
      process.env.JWT_SECRET || 'baseline-test-secret';
  });

  afterEach(() => {
    User.findOne = originals.userFindOne;
    User.create = originals.userCreate;
    Event.findById = originals.eventFindById;
    Registration.findOne =
      originals.registrationFindOne;
    Registration.create =
      originals.registrationCreate;
    Registration.find =
      originals.registrationFind;
    Attendance.find = originals.attendanceFind;
  });

  it(
    'FR-BASE-01 persists the selected coordinator role during registration',
    async () => {
      User.findOne = async () => null;

      let createdData;

      User.create = async (data) => {
        createdData = data;

        return {
          id: 'coordinator-1',
          name: data.name,
          email: data.email,
          role: data.role
        };
      };

      const req = {
        body: {
          name: 'Coordinator One',
          email: 'coordinator@example.com',
          password: 'Password123!',
          role: 'coordinator'
        }
      };

      const res = createResponse();

      await registerUser(req, res);

      assert.strictEqual(res.statusCode, 201);
      assert.strictEqual(
        createdData.role,
        'coordinator'
      );
      assert.strictEqual(
        res.body.role,
        'coordinator'
      );
    }
  );

  it(
    'FR-BASE-01 blocks volunteers from coordinator-only event management',
    () => {
      const req = {
        user: {
          id: 'volunteer-1',
          role: 'volunteer'
        }
      };

      const res = createResponse();

      let nextCalled = false;

      coordinatorOnly(req, res, () => {
        nextCalled = true;
      });

      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res.statusCode, 403);
      assert.strictEqual(
        res.body.message,
        'Coordinator access only'
      );
    }
  );

  it(
    'FR-BASE-02 rejects an event update when the coordinator is not the owner',
    async () => {
      Event.findById = async () => ({
        userId: {
          toString: () =>
            'coordinator-owner'
        }
      });

      const req = {
        user: {
          id: 'coordinator-other'
        },
        params: {
          id: 'event-1'
        },
        body: {
          title: 'Updated Event'
        }
      };

      const res = createResponse();

      await updateEvent(req, res);

      assert.strictEqual(
        res.statusCode,
        403
      );

      assert.strictEqual(
        res.body.message,
        'Not authorized to update this event'
      );
    }
  );

  it(
    'FR-BASE-02 allows the event owner to update their event',
    async () => {
      let saveCalls = 0;

      const event = {
        userId: {
          toString: () =>
            'coordinator-1'
        },
        title: 'Old Event',
        description: 'Old description',
        completed: false,
        deadline: null,

        async save() {
          saveCalls += 1;
          return this;
        }
      };

      Event.findById =
        async () => event;

      const req = {
        user: {
          id: 'coordinator-1'
        },
        params: {
          id: 'event-1'
        },
        body: {
          title: 'Updated Event',
          description:
            'Updated description'
        }
      };

      const res = createResponse();

      await updateEvent(req, res);

      assert.strictEqual(
        res.statusCode,
        200
      );

      assert.strictEqual(
        saveCalls,
        1
      );

      assert.strictEqual(
        event.title,
        'Updated Event'
      );

      assert.strictEqual(
        event.description,
        'Updated description'
      );
    }
  );

  it(
    'FR-BASE-03 registers a volunteer and rejects a duplicate active registration',
    async () => {
      const event = {
        _id: 'event-1',
        title: 'Clean-up Day'
      };

      Event.findById =
        async () => event;

      let currentRegistration =
        null;

      Registration.findOne =
        async () =>
          currentRegistration;

      Registration.create =
        async (data) => {
          currentRegistration = {
            ...data,

            toObject() {
              return {
                ...data
              };
            },

            async save() {
              return this;
            }
          };

          return currentRegistration;
        };

      const notificationService = {
        async notifyRegistrationConfirmed() {}
      };

      const req = {
        user: {
          id: 'volunteer-1',
          role: 'volunteer',
          name: 'Volunteer One',
          email:
            'volunteer@example.com'
        },
        params: {
          eventId: 'event-1'
        }
      };

      const firstRes =
        createResponse();

      await registerForEvent(
        req,
        firstRes,
        notificationService
      );

      assert.strictEqual(
        firstRes.statusCode,
        201
      );

      assert.strictEqual(
        firstRes.body.status,
        'registered'
      );

      const duplicateRes =
        createResponse();

      await registerForEvent(
        req,
        duplicateRes,
        notificationService
      );

      assert.strictEqual(
        duplicateRes.statusCode,
        400
      );

      assert.strictEqual(
        duplicateRes.body.message,
        'You are already registered for this event'
      );
    }
  );

  it(
    'FR-BASE-03 cancels an active registration and allows re-registration',
    async () => {
      const event = {
        _id: 'event-1',
        title: 'Clean-up Day'
      };

      Event.findById =
        async () => event;

      const registration = {
        eventId: 'event-1',
        volunteerId: 'volunteer-1',
        status: 'registered',
        reminderSentAt: new Date(),

        toObject() {
          return {
            eventId: this.eventId,
            volunteerId:
              this.volunteerId,
            status: this.status,
            reminderSentAt:
              this.reminderSentAt
          };
        },

        async save() {
          return this;
        }
      };

      Registration.findOne =
        async () => registration;

      const req = {
        user: {
          id: 'volunteer-1',
          role: 'volunteer',
          name: 'Volunteer One',
          email:
            'volunteer@example.com'
        },
        params: {
          eventId: 'event-1'
        }
      };

      const cancelRes =
        createResponse();

      await cancelRegistration(
        req,
        cancelRes
      );

      assert.strictEqual(
        cancelRes.statusCode,
        200
      );

      assert.strictEqual(
        registration.status,
        'cancelled'
      );

      const notificationService = {
        async notifyRegistrationConfirmed() {}
      };

      const registerRes =
        createResponse();

      await registerForEvent(
        req,
        registerRes,
        notificationService
      );

      assert.strictEqual(
        registerRes.statusCode,
        200
      );

      assert.strictEqual(
        registration.status,
        'registered'
      );

      assert.strictEqual(
        registration.reminderSentAt,
        null
      );
    }
  );

  it(
    'FR-BASE-04 returns active registered volunteers for a coordinator-owned event',
    async () => {
      Event.findById = async () => ({
        userId: {
          toString: () =>
            'coordinator-1'
        }
      });

      Registration.find =
        (query) => {
          assert.deepStrictEqual(
            query,
            {
              eventId: 'event-1',
              status: 'registered'
            }
          );

          return {
            populate: async () => [
              {
                volunteerId: {
                  _id: {
                    toString: () =>
                      'volunteer-1'
                  },
                  name:
                    'Volunteer One',
                  email:
                    'volunteer@example.com'
                },

                toObject() {
                  return {
                    eventId:
                      'event-1',
                    status:
                      'registered',
                    volunteerId:
                      this.volunteerId
                  };
                }
              }
            ]
          };
        };

      Attendance.find =
        async () => [];

      const result =
        await attendanceFacade
          .getRegisteredVolunteers(
            'coordinator-1',
            'event-1'
          );

      assert.strictEqual(
        result.length,
        1
      );

      assert.strictEqual(
        result[0].status,
        'registered'
      );

      assert.strictEqual(
        result[0].volunteerId.name,
        'Volunteer One'
      );

      assert.strictEqual(
        result[0].volunteerId.email,
        'volunteer@example.com'
      );
    }
  );

  it(
    'FR-BASE-04 rejects registration access for an event not owned by the coordinator',
    async () => {
      Event.findById = async () => ({
        userId: {
          toString: () =>
            'coordinator-owner'
        }
      });

      await assert.rejects(
        attendanceFacade
          .getRegisteredVolunteers(
            'coordinator-other',
            'event-1'
          ),

        (error) => {
          assert.strictEqual(
            error.statusCode,
            403
          );

          assert.strictEqual(
            error.message,
            'Not authorized to manage attendance for this event'
          );

          return true;
        }
      );
    }
  );
});