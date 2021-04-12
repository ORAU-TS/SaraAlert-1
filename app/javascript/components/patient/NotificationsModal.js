import React from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { PropTypes } from 'prop-types';
import axios from 'axios';
import reportError from '../util/ReportError';
import _ from 'lodash';

class NotificationsModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      sendEnabled: false,
      loaded: false,
      availableNotifications: {},
      notifications: {},
      errors: {},
    };

    this.getAvailableNotifications();
  }

  handleInputChange = event => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    const notifications = { ...this.state.notifications, [event.target.id]: value };

    this.setState({
      notifications: notifications,
      sendEnabled: this.hasAvailableNotifications(notifications),
    });
  };

  hide = () => {
    this.props.onClose();
  };

  getAvailableNotifications = () => {
    axios.defaults.headers.common['X-CSRF-Token'] = this.props.authenticity_token;
    const url = `${window.BASE_PATH}/notifications/available/${this.props.patientId}`;
    axios
      .get(url)
      .then(response => {
        const notifications = response.data;
        this.setState({
          loaded: true,
          availableNotifications: _.cloneDeep(notifications),
          notifications: _.cloneDeep(notifications),
          hasAvailableNotifications: this.hasAvailableNotifications(notifications),
          sendEnabled: this.hasAvailableNotifications(notifications),
        });
      })
      .catch(err => {
        reportError(err);
      });
  };

  hasAvailableNotifications = notifications => {
    return notifications.isolation || notifications.quarantine || notifications.housing;
  };

  sendNotifications = notifications => {
    axios.defaults.headers.common['X-CSRF-Token'] = this.props.authenticity_token;
    const url = `${window.BASE_PATH}/notifications/send`;
    const data = { notifications: notifications, patient_id: this.props.patientId };
    axios
      .post(url, data)
      .then(() => this.props.onClose(true))
      .catch(err => {
        reportError(err);
      });
  };

  sendSelectedNotifications = () => {
    const notifications = this.state.notifications;
    if (notifications.isolation || notifications.quarantine || notifications.housing) {
      this.sendNotifications(notifications);
    }
  };

  render() {
    return (
      <React.Fragment>
        <Modal show={this.props.show} dialogClassName="modal-am" aria-labelledby="contained-modal-title-vcenter" centered>
          <Modal.Header>
            <Modal.Title>Send Notifications</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {this.state.loaded && !this.state.hasAvailableNotifications && (
              <div className="saa-notification-header">
                No notification templates have been set. Please visit the
                <a href="/settings/notifications"> Notification Settings Page</a>
              </div>
            )}
            {this.state.hasAvailableNotifications && <div className="saa-notification-header">Clicking send will deliver the following communications:</div>}
            {this.state.availableNotifications.isolation && (
              <div className="saa-notification">
                <Form.Check
                  id="isolation"
                  inline
                  label="Isolation"
                  className="saa-inline-right-check"
                  checked={this.state.notifications.isolation}
                  onChange={this.handleInputChange}
                />
              </div>
            )}
            {this.state.availableNotifications.quarantine && (
              <div className="saa-notification">
                <Form.Check
                  id="quarantine"
                  inline
                  label="Quarantine"
                  className="saa-inline-right-check"
                  checked={this.state.notifications.quarantine}
                  onChange={this.handleInputChange}
                />
              </div>
            )}
            {this.state.availableNotifications.housing && (
              <div className="saa-notification">
                <Form.Check
                  id="housing"
                  inline
                  label="Housing"
                  className="saa-inline-right-check"
                  checked={this.state.notifications.housing}
                  onChange={this.handleInputChange}
                />
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button disabled={!this.state.sendEnabled} variant="primary btn-square" onClick={() => this.sendSelectedNotifications()}>
              Send
            </Button>
            <Button variant="secondary btn-square" onClick={() => this.hide()}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </React.Fragment>
    );
  }
}

NotificationsModal.propTypes = {
  patientId: PropTypes.number,
  show: PropTypes.bool,
  onClose: PropTypes.func,
  authenticity_token: PropTypes.string,
};

export default NotificationsModal;
