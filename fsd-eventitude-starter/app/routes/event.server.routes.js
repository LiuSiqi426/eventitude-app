import eventController from '../controllers/event.server.controller.js';

export default function(app) {
    // Get all events
    app.route('/api/events')
        .get(eventController.getAllEvents)
        .post(eventController.createEvent);

    // Get single event
    app.route('/api/events/:eventId')
        .get(eventController.getEvent)
        .patch(eventController.updateEvent)
        .delete(eventController.deleteEvent);

    // Search events
    app.route('/api/events/search/:query')
        .get(eventController.searchEvents);

    // Get events by organizer - 新增路由
    app.route('/api/events/organizer/:organizerId')
        .get(eventController.getEventsByOrganizer);
}