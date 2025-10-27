import questionController from '../controllers/question.server.controller.js';

export default function(app) {
    // Get questions for event
    app.route('/api/events/:eventId/questions')
        .get(questionController.getQuestions)
        .post(questionController.createQuestion);

    // Manage specific question
    app.route('/api/questions/:questionId')
        .patch(questionController.updateQuestion)
        .delete(questionController.deleteQuestion);

    // Upvote question
    app.route('/api/questions/:questionId/upvote')
        .post(questionController.upvoteQuestion);
}