import React from 'react';
import { Card, Table, Button, OverlayTrigger, Tooltip } from 'react-bootstrap';
import PropTypes from 'prop-types';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import EditNotificationModal from './EditNotificationModal';
import ConfirmRevertModal from './ConfirmRevertModal';
import reportError from '../util/ReportError';

class NotificationSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      all_messages: this.props.all_messages,
      showModal: false,
      showRevertModal: false,
      message: {},
      revertMessageSelection: null,
    };
  }

  getRevertConfirmation(message) {
    this.setState({
      revertMessageSelection: message,
      showRevertModal: true,
    });
  }

  revertCustomMessage(message) {
    axios.defaults.headers.common['X-CSRF-Token'] = this.props.authenticity_token;
    axios({
      method: 'delete',
      url: window.BASE_PATH + '/settings/notifications/' + message.message_type,
    })
      .then(() => {
        this.setMessageIsCustomized(message.message_type, false);
      })
      .catch(err => {
        reportError(err);
      });
  }

  setMessageIsCustomized = (messageType, isCustomized) => {
    let allMessages = this.state.all_messages;
    let message = allMessages.find(m => m.message_type == messageType);
    message.is_customized = isCustomized;
    this.setState({ all_messages: allMessages, showRevertModal: false });
  };

  getCustomMessage(message) {
    axios.defaults.headers.common['X-CSRF-Token'] = this.props.authenticity_token;
    axios({
      method: 'get',
      url: window.BASE_PATH + '/settings/notifications/' + message.message_type,
    })
      .then(response => {
        this.setState({
          message: {
            message_variant: response.data.message_variant,
            needs_recipients: response.data.needs_recipients,
            recipients: response.data.recipients,
            key_list: response.data.key_list,
            message_type: message.message_type,
            title: message.title,
            subject: response.data.subject,
            body: response.data.body,
            length_difference: response.data.length_difference,
          },
          showModal: true,
        });
      })
      .catch(err => {
        reportError(err);
      });
  }

  handleModalClose = () => {
    this.setState({
      showModal: false,
    });
  };

  handleRevertModalClose = () => {
    this.setState({
      showRevertModal: false,
    });
  };

  getNotifiationTable(notifications) {
    return (
      <Table striped bordered hover className="saa-notifications-table">
        <thead>
          <tr>
            <th>Notification Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {notifications.map((message, i) => {
            return (
              <tr key={i}>
                <td>{message.title}</td>
                <td>
                  <Button variant="primary btn-square" onClick={() => this.getCustomMessage(message)}>
                    Edit
                  </Button>{' '}
                  &nbsp; &nbsp;
                  {message.is_customized && (
                    <Button variant="primary btn-square" onClick={() => this.getRevertConfirmation(message)}>
                      Revert
                    </Button>
                  )}
                  {!message.is_customized && (
                    <OverlayTrigger overlay={<Tooltip>This uses the default message</Tooltip>}>
                      <Button disabled={true} variant="primary btn-square">
                        Revert
                      </Button>
                    </OverlayTrigger>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    );
  }

  render() {
    return (
      <React.Fragment>
        <Card className="card-square">
          <Card.Header as="h5">SMS Notification Templates</Card.Header>
          <Card.Body>{this.getNotifiationTable(this.state.all_messages.filter(m => m.display_group == 1))}</Card.Body>
        </Card>
        <div>&nbsp;</div>
        <Card className="card-square">
          <Card.Header as="h5">Email Notification Templates</Card.Header>
          <Card.Body>{this.getNotifiationTable(this.state.all_messages.filter(m => m.display_group == 2))}</Card.Body>
        </Card>
        <div>&nbsp;</div>
        <Card className="card-square">
          <Card.Header as="h5">Triage Templates</Card.Header>
          <Card.Body>{this.getNotifiationTable(this.state.all_messages.filter(m => m.display_group == 3))}</Card.Body>
        </Card>
        {this.state.showModal && (
          <EditNotificationModal
            authenticity_token={this.props.authenticity_token}
            show={this.state.showModal}
            initialMessage={this.state.message}
            onClose={this.handleModalClose}
            setMessageIsCustomized={this.setMessageIsCustomized}
          />
        )}
        {this.state.showRevertModal && (
          <ConfirmRevertModal
            show={this.state.showRevertModal}
            revertConfirmed={() => this.revertCustomMessage(this.state.revertMessageSelection)}
            onClose={() => this.handleRevertModalClose()}
          />
        )}
      </React.Fragment>
    );
  }
}

NotificationSettings.propTypes = {
  authenticity_token: PropTypes.string,
  notifications: PropTypes.object,
  jurisdiction_id: PropTypes.number,
  all_messages: PropTypes.array,
};

export default NotificationSettings;
