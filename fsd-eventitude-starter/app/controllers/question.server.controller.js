import db from '../../database.js';
import profanityFilter from '../libs/profanityFilter.js';

export const getQuestions = function(req, res) {
    const eventId = req.params.eventId;    
    console.log('Getting questions for event:', eventId);

    const sql = `SELECT q.*, u.first_name || ' ' || u.last_name as author_name 
                FROM questions q 
                JOIN users u ON q.user_id = u.user_id 
                WHERE q.event_id = ? 
                ORDER BY q.upvotes DESC, q.created_date DESC`;
    
    db.all(sql, [eventId], (err, questions) => {
        if (err) {
            console.error('Database error in getQuestions:', err);
            return res.status(500).json({
                status: 'error',
                message: 'Database error: ' + err.message
            });
        }

        // 格式化问题数据
        const formattedQuestions = questions.map(question => ({
            id: question.question_id,
            content: question.question_text,
            event_id: question.event_id,
            user_id: question.user_id,
            author_name: question.author_name,
            upvotes: question.upvotes || 0,
            created_at: question.created_date
        }));

        console.log('Found questions:', formattedQuestions.length);
        res.json({
            status: 'success',
            data: formattedQuestions
        });
    });
};

export const createQuestion = function(req, res) {
    const eventId = req.params.eventId;
    const { content, user_id } = req.body;

    console.log('Creating question:', { eventId, content, user_id });

    if (!content || !user_id) {
        return res.status(400).json({
            status: 'error',
            message: 'Content and user_id are required'
        });
    }

    if (profanityFilter.containsProfanity(content)) {
        return res.status(400).json({
            status: 'error',
            message: 'Question contains inappropriate language'
        });
    }

    const filteredContent = profanityFilter.filter(content);

    const sql = `INSERT INTO questions (question_text, event_id, user_id, upvotes, created_date) 
                VALUES (?, ?, ?, 0, datetime('now'))`;
    
    db.run(sql, [content, eventId, user_id], function(err) {
        if (err) {
            console.error('Error creating question:', err);
            return res.status(500).json({
                status: 'error',
                message: 'Error creating question: ' + err.message
            });
        }

        console.log('Question created successfully with ID:', this.lastID);
        res.status(201).json({
            status: 'success',
            message: 'Question created successfully',
            questionId: this.lastID
        });
    });
};

export const updateQuestion = function(req, res) {
    const questionId = req.params.questionId;
    const { content } = req.body;

    const sql = 'UPDATE questions SET question_text = ? WHERE question_id = ?';
    db.run(sql, [content, questionId], function(err) {
        if (err) {
            console.error('Error updating question:', err);
            return res.status(500).json({
                status: 'error',
                message: 'Database error'
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Question not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Question updated successfully'
        });
    });
};

export const deleteQuestion = function(req, res) {
    const questionId = req.params.questionId;

    const sql = 'DELETE FROM questions WHERE question_id = ?';
    db.run(sql, [questionId], function(err) {
        if (err) {
            console.error('Error deleting question:', err);
            return res.status(500).json({
                status: 'error',
                message: 'Database error'
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Question not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Question deleted successfully'
        });
    });
};

export const upvoteQuestion = function(req, res) {
    const questionId = req.params.questionId;

    const sql = 'UPDATE questions SET upvotes = upvotes + 1 WHERE question_id = ?';
    db.run(sql, [questionId], function(err) {
        if (err) {
            console.error('Error upvoting question:', err);
            return res.status(500).json({
                status: 'error',
                message: 'Database error'
            });
        }

        if (this.changes === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'Question not found'
            });
        }

        res.json({
            status: 'success',
            message: 'Question upvoted successfully'
        });
    });
};

export default {
    getQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    upvoteQuestion
};