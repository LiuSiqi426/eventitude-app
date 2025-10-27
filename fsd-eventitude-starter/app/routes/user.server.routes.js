import userController from '../controllers/user.server.controller.js';

export default function(app) {
    // User registration
    app.route('/api/users/register')
        .post(userController.register);

    // User login
    app.route('/api/users/login')
        .post(userController.login);

    // User logout
    app.route('/api/users/logout')
        .post(userController.logout);

    // Get user profile
    app.route('/api/users/:userId')
        .get(userController.getProfile)
        .patch(userController.updateProfile);

    // Get all users (admin only)
    app.route('/api/users')
        .get(userController.getAllUsers);
}