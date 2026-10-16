const assert = require('assert');

const attendanceFacade =
  require('../services/AttendanceFacade');
const Attendance = require('../models/Attendance');
const Registration = require('../models/Registration');
const Event = require('../models/Event');

describe('Epic 2 - Event Attendance / Check-in', () => {
  let originalEventFindById;
  let originalRegistrationFind;
  let originalRegistrationFindOne;
  let originalAttendanceFind;
  let originalAttendanceFindOne;
  let originalAttendanceCreate;

  beforeEach(() => {
    originalEventFindById = Event.findById;
    originalRegistrationFind = Registration.find;
    originalRegistrationFindOne = Registration.findOne;
    originalAttendanceFind = Attendance.find;
    originalAttendanceFindOne = Attendance.findOne;
    originalAttendanceCreate = Attendance.create;
  });

  afterEach(() => {
    Event.findById = originalEventFindById;
    Registration.find = originalRegistrationFind;
    Registration.findOne = originalRegistrationFindOne;
    Attendance.find = originalAttendanceFind;
    Attendance.findOne = originalAttendanceFindOne;
    Attendance.create = originalAttendanceCreate;
  });

  describe('Story 1 - Registered Volunteer Attendance View', () => {
    it('returns actively registered volunteers with their current attendance status', async () => {
      Event.findById = async (eventId) => {
        assert.strictEqual(eventId, 'event-1');
        return { userId: 'coordinator-1' };
      };

      Registration.find = (query) => {
        assert.deepStrictEqual(query, {
          eventId: 'event-1',
          status: 'registered'
        });

        return {
          populate: async (path, fields) => {
            assert.strictEqual(path, 'volunteerId');
            assert.strictEqual(
              fields,
              'name email university address'
            );

            return [
              {
                volunteerId: { _id: 'volunteer-1' },
                toObject() {
                  return {
                    _id: 'registration-1',
                    eventId: 'event-1',
                    volunteerId: this.volunteerId,
                    status: 'registered'
                  };
                }
              },
              {
                volunteerId: { _id: 'volunteer-2' },
                toObject() {
                  return {
                    _id: 'registration-2',
                    eventId: 'event-1',
                    volunteerId: this.volunteerId,
                    status: 'registered'
                  };
                }
              }
            ];
          }
        };
      };

      Attendance.find = async (query) => {
        assert.deepStrictEqual(query, {
          eventId: 'event-1'
        });

        return [
          {
            volunteerId: 'volunteer-1',
            status: 'present'
          }
        ];
      };

      const result =
        await attendanceFacade.getRegisteredVolunteers(
          'coordinator-1',
          'event-1'
        );

      assert.strictEqual(result.length, 2);
      assert.strictEqual(
        result[0].attendanceStatus,
        'present'
      );
      assert.strictEqual(
        result[1].attendanceStatus,
        null
      );
    });

    it('returns an empty list when the event has no active registrations', async () => {
      Event.findById = async () => ({
        userId: 'coordinator-1'
      });

      Registration.find = () => ({
        populate: async () => []
      });

      Attendance.find = async () => [];

      const result =
        await attendanceFacade.getRegisteredVolunteers(
          'coordinator-1',
          'event-1'
        );

      assert.deepStrictEqual(result, []);
    });

    it('rejects access when the coordinator does not own the event', async () => {
      Event.findById = async () => ({
        userId: 'coordinator-owner'
      });

      await assert.rejects(
        attendanceFacade.getRegisteredVolunteers(
          'coordinator-other',
          'event-1'
        ),
        (error) => {
          assert.strictEqual(error.statusCode, 403);
          assert.strictEqual(
            error.message,
            'Not authorized to manage attendance for this event'
          );
          return true;
        }
      );
    });
  });

  describe('Story 2 - Attendance Recording', () => {
    it('records Present attendance for the correct event-volunteer pair', async () => {
      Event.findById = async () => ({
        userId: 'coordinator-1'
      });

      Registration.findOne = async (query) => {
        assert.deepStrictEqual(query, {
          eventId: 'event-1',
          volunteerId: 'volunteer-1',
          status: 'registered'
        });

        return { _id: 'registration-1' };
      };

      Attendance.findOne = async (query) => {
        assert.deepStrictEqual(query, {
          eventId: 'event-1',
          volunteerId: 'volunteer-1'
        });
        return null;
      };

      Attendance.create = async (data) => {
        assert.deepStrictEqual(data, {
          eventId: 'event-1',
          volunteerId: 'volunteer-1',
          status: 'present'
        });

        return {
          _id: 'attendance-1',
          ...data
        };
      };

      const result =
        await attendanceFacade.recordAttendance(
          'coordinator-1',
          'event-1',
          'volunteer-1',
          'present'
        );

      assert.strictEqual(result.status, 'present');
      assert.strictEqual(result.eventId, 'event-1');
      assert.strictEqual(
        result.volunteerId,
        'volunteer-1'
      );
    });

    it('records Absent as a valid attendance status', async () => {
      Event.findById = async () => ({
        userId: 'coordinator-1'
      });

      Registration.findOne = async () => ({
        _id: 'registration-1'
      });

      Attendance.findOne = async () => null;

      Attendance.create = async (data) => ({
        _id: 'attendance-1',
        ...data
      });

      const result =
        await attendanceFacade.recordAttendance(
          'coordinator-1',
          'event-1',
          'volunteer-1',
          'absent'
        );

      assert.strictEqual(result.status, 'absent');
    });

    it('prevents a second attendance record for the same event-volunteer pair', async () => {
      Event.findById = async () => ({
        userId: 'coordinator-1'
      });

      Registration.findOne = async () => ({
        _id: 'registration-1'
      });

      Attendance.findOne = async () => ({
        _id: 'attendance-existing',
        status: 'present'
      });

      let createCalled = false;

      Attendance.create = async () => {
        createCalled = true;
      };

      await assert.rejects(
        attendanceFacade.recordAttendance(
          'coordinator-1',
          'event-1',
          'volunteer-1',
          'absent'
        ),
        (error) => {
          assert.strictEqual(error.statusCode, 400);
          assert.strictEqual(
            error.message,
            'Attendance has already been recorded for this volunteer'
          );
          return true;
        }
      );

      assert.strictEqual(createCalled, false);
    });
  });

  describe('Story 3 - Attendance Status Update', () => {
    it('updates an existing attendance status from Present to Absent', async () => {
      Event.findById = async () => ({
        userId: 'coordinator-1'
      });

      Registration.findOne = async () => ({
        _id: 'registration-1'
      });

      let saveCalls = 0;

      const attendanceRecord = {
        _id: 'attendance-1',
        eventId: 'event-1',
        volunteerId: 'volunteer-1',
        status: 'present',
        async save() {
          saveCalls += 1;
          return this;
        }
      };

      Attendance.findOne = async (query) => {
        assert.deepStrictEqual(query, {
          eventId: 'event-1',
          volunteerId: 'volunteer-1'
        });

        return attendanceRecord;
      };

      const result =
        await attendanceFacade.updateAttendance(
          'coordinator-1',
          'event-1',
          'volunteer-1',
          'absent'
        );

      assert.strictEqual(result.status, 'absent');
      assert.strictEqual(saveCalls, 1);
    });

    it('updates only the selected volunteer attendance record', async () => {
      Event.findById = async () => ({
        userId: 'coordinator-1'
      });

      Registration.findOne = async () => ({
        _id: 'registration-1'
      });

      const selectedAttendance = {
        volunteerId: 'volunteer-1',
        status: 'absent',
        async save() {
          return this;
        }
      };

      const unrelatedAttendance = {
        volunteerId: 'volunteer-2',
        status: 'present'
      };

      Attendance.findOne = async (query) => {
        assert.deepStrictEqual(query, {
          eventId: 'event-1',
          volunteerId: 'volunteer-1'
        });

        return selectedAttendance;
      };

      await attendanceFacade.updateAttendance(
        'coordinator-1',
        'event-1',
        'volunteer-1',
        'present'
      );

      assert.strictEqual(
        selectedAttendance.status,
        'present'
      );

      assert.strictEqual(
        unrelatedAttendance.status,
        'present'
      );
    });

    it('rejects an update when no attendance record exists', async () => {
      Event.findById = async () => ({
        userId: 'coordinator-1'
      });

      Registration.findOne = async () => ({
        _id: 'registration-1'
      });

      Attendance.findOne = async () => null;

      await assert.rejects(
        attendanceFacade.updateAttendance(
          'coordinator-1',
          'event-1',
          'volunteer-1',
          'present'
        ),
        (error) => {
          assert.strictEqual(error.statusCode, 404);
          assert.strictEqual(
            error.message,
            'Attendance record not found'
          );
          return true;
        }
      );
    });
  });

  describe('Story 4 - Secure Attendance Management', () => {
    it('rejects a coordinator who does not own the event without modifying attendance', async () => {
      Event.findById = async () => ({
        userId: 'coordinator-owner'
      });

      let registrationChecked = false;
      let attendanceCreated = false;

      Registration.findOne = async () => {
        registrationChecked = true;
        return { _id: 'registration-1' };
      };

      Attendance.create = async () => {
        attendanceCreated = true;
      };

      await assert.rejects(
        attendanceFacade.recordAttendance(
          'coordinator-other',
          'event-1',
          'volunteer-1',
          'present'
        ),
        (error) => {
          assert.strictEqual(error.statusCode, 403);
          return true;
        }
      );

      assert.strictEqual(
        registrationChecked,
        false
      );

      assert.strictEqual(
        attendanceCreated,
        false
      );
    });

    it('rejects attendance recording for a volunteer without an active registration', async () => {
      Event.findById = async () => ({
        userId: 'coordinator-1'
      });

      Registration.findOne = async (query) => {
        assert.deepStrictEqual(query, {
          eventId: 'event-1',
          volunteerId: 'volunteer-1',
          status: 'registered'
        });

        return null;
      };

      let attendanceCreated = false;

      Attendance.create = async () => {
        attendanceCreated = true;
      };

      await assert.rejects(
        attendanceFacade.recordAttendance(
          'coordinator-1',
          'event-1',
          'volunteer-1',
          'present'
        ),
        (error) => {
          assert.strictEqual(error.statusCode, 400);
          assert.strictEqual(
            error.message,
            'Volunteer is not actively registered for this event'
          );
          return true;
        }
      );

      assert.strictEqual(
        attendanceCreated,
        false
      );
    });

    it('rejects an invalid attendance status before modifying data', async () => {
      let eventLookupCalled = false;
      let attendanceCreated = false;

      Event.findById = async () => {
        eventLookupCalled = true;

        return {
          userId: 'coordinator-1'
        };
      };

      Attendance.create = async () => {
        attendanceCreated = true;
      };

      await assert.rejects(
        attendanceFacade.recordAttendance(
          'coordinator-1',
          'event-1',
          'volunteer-1',
          'late'
        ),
        (error) => {
          assert.strictEqual(error.statusCode, 400);
          assert.strictEqual(
            error.message,
            'Attendance status must be present or absent'
          );
          return true;
        }
      );

      assert.strictEqual(
        eventLookupCalled,
        false
      );

      assert.strictEqual(
        attendanceCreated,
        false
      );
    });
  });
});