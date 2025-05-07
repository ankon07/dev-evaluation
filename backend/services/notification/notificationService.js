const User = require('../../models/User');
const Evaluation = require('../../models/Evaluation');
const Notification = require('../../models/Notification');
const nodemailer = require('nodemailer');

class NotificationService {
  /**
   * Send email notification
   * @param {string} to - Recipient email
   * @param {string} subject - Email subject
   * @param {string} html - Email content in HTML format
   * @returns {Promise<Object>} - Result of sending email
   */
  async sendEmail(to, subject, html) {
    try {
      // In a production environment, configure a real email service
      // For development, we'll use a mock implementation
      console.log(`Email notification sent to ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content: ${html}`);
      
      return { success: true, message: 'Email notification sent successfully' };
    } catch (error) {
      console.error(`Error sending email notification: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send in-app notification
   * @param {string} userId - User ID
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} type - Notification type (info, success, warning, error)
   * @param {Object} data - Additional data
   * @returns {Promise<Object>} - Created notification
   */
  async sendInAppNotification(userId, title, message, type = 'info', data = {}) {
    try {
      // Create notification in the database
      const notification = await Notification.create({
        user: userId,
        title,
        message,
        type,
        data
      });
      
      console.log(`In-app notification created for user ${userId}`);
      console.log(`Title: ${title}`);
      console.log(`Message: ${message}`);
      console.log(`Type: ${type}`);
      
      return { success: true, message: 'In-app notification created successfully', notification };
    } catch (error) {
      console.error(`Error creating in-app notification: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notify developer about new evaluation
   * @param {string} evaluationId - Evaluation ID
   * @returns {Promise<Object>} - Result of notification
   */
  async notifyDeveloperAboutNewEvaluation(evaluationId) {
    try {
      const evaluation = await Evaluation.findById(evaluationId).populate('developer');
      if (!evaluation) {
        throw new Error('Evaluation not found');
      }

      const developer = evaluation.developer;
      if (!developer) {
        throw new Error('Developer not found');
      }

      // Send email notification
      const subject = 'New Evaluation Period Started';
      const html = `
        <h1>New Evaluation Period</h1>
        <p>Hello ${developer.name},</p>
        <p>A new evaluation period has been created for you:</p>
        <ul>
          <li><strong>Start Date:</strong> ${new Date(evaluation.period.startDate).toLocaleDateString()}</li>
          <li><strong>End Date:</strong> ${new Date(evaluation.period.endDate).toLocaleDateString()}</li>
        </ul>
        <p>Your performance during this period will be evaluated based on task completion, code quality, collaboration, CI/CD success, and knowledge sharing.</p>
        <p>You can view more details in your dashboard.</p>
        <p>Best regards,<br>Dev Evaluation System</p>
      `;
      await this.sendEmail(developer.email, subject, html);

      // Send in-app notification
      await this.sendInAppNotification(
        developer._id,
        'New Evaluation Period',
        `A new evaluation period has been created for you (${new Date(evaluation.period.startDate).toLocaleDateString()} - ${new Date(evaluation.period.endDate).toLocaleDateString()})`,
        'info',
        { evaluationId: evaluation._id }
      );

      return { success: true, message: 'Developer notified about new evaluation' };
    } catch (error) {
      console.error(`Error notifying developer about new evaluation: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notify developer about completed evaluation
   * @param {string} evaluationId - Evaluation ID
   * @returns {Promise<Object>} - Result of notification
   */
  async notifyDeveloperAboutCompletedEvaluation(evaluationId) {
    try {
      const evaluation = await Evaluation.findById(evaluationId).populate('developer');
      if (!evaluation) {
        throw new Error('Evaluation not found');
      }

      const developer = evaluation.developer;
      if (!developer) {
        throw new Error('Developer not found');
      }

      // Send email notification
      const subject = 'Evaluation Completed';
      const html = `
        <h1>Evaluation Completed</h1>
        <p>Hello ${developer.name},</p>
        <p>Your evaluation for the period ${new Date(evaluation.period.startDate).toLocaleDateString()} - ${new Date(evaluation.period.endDate).toLocaleDateString()} has been completed.</p>
        <ul>
          <li><strong>Overall Score:</strong> ${evaluation.overallScore}</li>
          <li><strong>Token Reward:</strong> ${evaluation.tokenReward}</li>
        </ul>
        <p>You can view detailed results in your dashboard.</p>
        <p>Best regards,<br>Dev Evaluation System</p>
      `;
      await this.sendEmail(developer.email, subject, html);

      // Send in-app notification
      await this.sendInAppNotification(
        developer._id,
        'Evaluation Completed',
        `Your evaluation has been completed with a score of ${evaluation.overallScore} and a reward of ${evaluation.tokenReward} tokens`,
        'success',
        { evaluationId: evaluation._id }
      );

      return { success: true, message: 'Developer notified about completed evaluation' };
    } catch (error) {
      console.error(`Error notifying developer about completed evaluation: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notify admin about evaluation requiring approval
   * @param {string} evaluationId - Evaluation ID
   * @param {string} approvalType - Type of approval needed
   * @returns {Promise<Object>} - Result of notification
   */
  async notifyAdminAboutApprovalNeeded(evaluationId, approvalType) {
    try {
      const evaluation = await Evaluation.findById(evaluationId).populate('developer');
      if (!evaluation) {
        throw new Error('Evaluation not found');
      }

      // Get all admin users
      const admins = await User.find({ role: 'admin' });
      if (!admins || admins.length === 0) {
        throw new Error('No admin users found');
      }

      // Send notifications to all admins
      for (const admin of admins) {
        // Send email notification
        const subject = 'Evaluation Approval Required';
        const html = `
          <h1>Approval Required</h1>
          <p>Hello ${admin.name},</p>
          <p>An evaluation for ${evaluation.developer.name} requires your approval for ${approvalType}.</p>
          <p>Evaluation Period: ${new Date(evaluation.period.startDate).toLocaleDateString()} - ${new Date(evaluation.period.endDate).toLocaleDateString()}</p>
          <p>Please review and approve in the admin dashboard.</p>
          <p>Best regards,<br>Dev Evaluation System</p>
        `;
        await this.sendEmail(admin.email, subject, html);

        // Send in-app notification
        await this.sendInAppNotification(
          admin._id,
          'Approval Required',
          `Evaluation for ${evaluation.developer.name} requires your approval for ${approvalType}`,
          'warning',
          { evaluationId: evaluation._id, approvalType }
        );
      }

      return { success: true, message: 'Admins notified about approval needed' };
    } catch (error) {
      console.error(`Error notifying admins about approval needed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notify admin about evaluation status change
   * @param {string} evaluationId - Evaluation ID
   * @param {string} status - New status
   * @returns {Promise<Object>} - Result of notification
   */
  async notifyAdminAboutStatusChange(evaluationId, status) {
    try {
      const evaluation = await Evaluation.findById(evaluationId).populate('developer');
      if (!evaluation) {
        throw new Error('Evaluation not found');
      }

      // Get all admin users
      const admins = await User.find({ role: 'admin' });
      if (!admins || admins.length === 0) {
        throw new Error('No admin users found');
      }

      // Send notifications to all admins
      for (const admin of admins) {
        // Send email notification
        const subject = `Evaluation Status Changed to ${status}`;
        const html = `
          <h1>Evaluation Status Update</h1>
          <p>Hello ${admin.name},</p>
          <p>The evaluation for ${evaluation.developer.name} has changed status to ${status}.</p>
          <p>Evaluation Period: ${new Date(evaluation.period.startDate).toLocaleDateString()} - ${new Date(evaluation.period.endDate).toLocaleDateString()}</p>
          <p>You can view details in the admin dashboard.</p>
          <p>Best regards,<br>Dev Evaluation System</p>
        `;
        await this.sendEmail(admin.email, subject, html);

        // Send in-app notification
        await this.sendInAppNotification(
          admin._id,
          'Evaluation Status Update',
          `Evaluation for ${evaluation.developer.name} has changed status to ${status}`,
          status === 'completed' ? 'success' : status === 'failed' ? 'error' : 'info',
          { evaluationId: evaluation._id }
        );
      }

      return { success: true, message: 'Admins notified about status change' };
    } catch (error) {
      console.error(`Error notifying admins about status change: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  /**
   * Notify about token transaction
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} - Result of notification
   */
  async notifyAboutTokenTransaction(transactionId) {
    try {
      // Fetch transaction from database
      const Transaction = require('../../models/Transaction');
      const transaction = await Transaction.findById(transactionId)
        .populate('from', 'name email')
        .populate('to', 'name email');
      
      if (!transaction) {
        throw new Error('Transaction not found');
      }
      
      // Determine notification details based on transaction type
      let title, message, type;
      
      switch (transaction.type) {
        case 'mint':
          title = 'Tokens Minted';
          message = `${transaction.amount} tokens have been minted to your account`;
          type = 'success';
          break;
        case 'transfer':
          title = 'Tokens Transferred';
          message = `${transaction.amount} tokens have been transferred`;
          type = 'info';
          break;
        case 'burn':
          title = 'Tokens Burned';
          message = `${transaction.amount} tokens have been burned from your account`;
          type = 'warning';
          break;
        case 'stake':
          title = 'Tokens Staked';
          message = `${transaction.amount} tokens have been staked`;
          type = 'info';
          break;
        case 'unstake':
          title = 'Tokens Unstaked';
          message = `Your staked tokens have been released`;
          type = 'info';
          break;
        case 'redeem':
          title = 'Tokens Redeemed';
          message = `${transaction.amount} tokens have been redeemed`;
          type = 'info';
          break;
        default:
          title = 'Token Transaction';
          message = `A token transaction has been processed`;
          type = 'info';
      }
      
      // Send notifications to relevant users
      const notificationPromises = [];
      
      // Notify sender if exists
      if (transaction.from) {
        const fromMessage = transaction.type === 'transfer' 
          ? `You sent ${transaction.amount} tokens to ${transaction.to?.name || 'another user'}`
          : message;
        
        notificationPromises.push(
          this.sendInAppNotification(
            transaction.from._id,
            title,
            fromMessage,
            type,
            { transactionId: transaction._id }
          )
        );
      }
      
      // Notify recipient if exists and different from sender
      if (transaction.to && (!transaction.from || transaction.to._id.toString() !== transaction.from._id.toString())) {
        const toMessage = transaction.type === 'transfer'
          ? `You received ${transaction.amount} tokens from ${transaction.from?.name || 'another user'}`
          : `${transaction.amount} tokens have been added to your account`;
        
        notificationPromises.push(
          this.sendInAppNotification(
            transaction.to._id,
            title,
            toMessage,
            type,
            { transactionId: transaction._id }
          )
        );
      }
      
      // Wait for all notifications to be sent
      await Promise.all(notificationPromises);
      
      return { success: true, message: 'Token transaction notifications sent' };
    } catch (error) {
      console.error(`Error notifying about token transaction: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new NotificationService();
