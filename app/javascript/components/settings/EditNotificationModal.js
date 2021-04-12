import React from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { PropTypes } from 'prop-types';
import * as yup from 'yup';
import axios from 'axios';
import reportError from '../util/ReportError';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

class EditNotificationModal extends React.Component {
  constructor(props) {
    super(props);
    const intialMessageState = { ...this.props.initialMessage, actualLength: -1 };
    this.updateRealLength(intialMessageState);

    this.state = {
      message: intialMessageState,
      errors: {},
    };
    this.updateRealLength = this.updateRealLength.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.onEditorStateChange = this.onEditorStateChange.bind(this);
  }

  handleInputChange(event) {
    let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    let updatedMessage = { ...this.state.message, [event.target.id]: value };
    this.updateRealLength(updatedMessage);

    this.setState({ message: updatedMessage });
  }

  onEditorStateChange(event, editor) {
    this.setState({
      message: { ...this.state.message, body: editor.getData() },
    });
  }

  updateRealLength(message) {
    const bodyLength = message.body ? message.body.length : 0;
    message.actualLength = bodyLength - message.length_difference;
  }

  hide = () => {
    this.props.onClose();
  };

  updateCustomMessage(updatedMessage) {
    axios.defaults.headers.common['X-CSRF-Token'] = this.props.authenticity_token;
    axios({
      method: 'post',
      url: window.BASE_PATH + '/settings/notifications',
      data: { message: updatedMessage },
    })
      .then(response => {
        const { is_customized } = response.data;
        this.props.setMessageIsCustomized(updatedMessage.message_type, is_customized);
        this.props.onClose();
      })
      .catch(err => {
        reportError(err);
      });
  }

  validateAndUpdate() {
    let self = this;
    schema
      .validate(this.state.message, { abortEarly: false })
      .then(function() {
        self.setState({ errors: {} }, () => {
          self.updateCustomMessage(self.state.message);
        });
      })
      .catch(err => {
        if (err && err.inner) {
          let issues = {};
          for (var issue of err.inner) {
            issues[issue['path']] = issue['errors'];
          }
          self.setState({ errors: issues });
        }
      });
  }

  render() {
    return (
      <React.Fragment>
        <Modal
          //prevent bootstrap modal from blocking insert link input focus
          enforceFocus={false}
          show={this.props.show}
          onHide={this.hide}
          dialogClassName="modal-am"
          aria-labelledby="contained-modal-title-vcenter"
          centered>
          <Modal.Header closeButton>
            <Modal.Title>{this.state.message.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div>
              {this.state.message.key_list.length > 0 && (
                <Form.Group>
                  <Form.Label>Message Keys</Form.Label>
                  <ul>
                    {this.state.message.key_list.map((key, i) => (
                      <li key={i}>
                        {key.name} - {key.description}
                      </li>
                    ))}
                  </ul>
                </Form.Group>
              )}
            </div>
            {this.state.message.needs_recipients && (
              <Form.Group controlId="recipients">
                <Form.Label>Recipients</Form.Label>
                <Form.Control isInvalid={this.state.errors['recipients']} value={this.state.message.recipients} onChange={this.handleInputChange} />
                <Form.Control.Feedback className="d-block" type="invalid">
                  {this.state.errors['recipients']}
                </Form.Control.Feedback>
              </Form.Group>
            )}
            {this.state.message.message_variant == 'email' && (
              <Form.Group controlId="subject">
                <Form.Label>Subject</Form.Label>
                <Form.Control isInvalid={this.state.errors['subject']} value={this.state.message.subject} onChange={this.handleInputChange} />
                <Form.Control.Feedback className="d-block" type="invalid">
                  {this.state.errors['subject']}
                </Form.Control.Feedback>
              </Form.Group>
            )}
            {(this.state.message.message_variant == 'email' || this.state.message.message_variant == 'shared_html') && (
              <Form.Group controlId="body">
                <Form.Label>Message</Form.Label>
                <CKEditor
                  editor={ClassicEditor}
                  data={this.state.message.body}
                  config={{
                    toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote'],
                    heading: {
                      options: [
                        { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
                        { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
                        { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
                      ],
                    },
                  }}
                  onChange={this.onEditorStateChange}
                />
                <Form.Control.Feedback className="d-block" type="invalid">
                  {this.state.errors['body']}
                </Form.Control.Feedback>
              </Form.Group>
            )}
            {(this.state.message.message_variant == 'sms' || this.state.message.message_variant == 'shared_text') && (
              <Form.Group controlId="body">
                <Form.Label>Message</Form.Label>
                <Form.Control isInvalid={this.state.errors['body']} as="textarea" rows="3" value={this.state.message.body} onChange={this.handleInputChange} />
                <Form.Control.Feedback className="d-block" type="invalid">
                  {this.state.errors['body']}
                </Form.Control.Feedback>
              </Form.Group>
            )}
            <div>
              {this.state.message.message_variant == 'sms' && (
                <Form.Text className="text-muted">SMS messages are 160 characters max. Actual SMS message length: {this.state.message.actualLength}.</Form.Text>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary btn-square" onClick={() => this.validateAndUpdate()}>
              Update
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

var schema = yup.object().shape({
  body: yup
    .string()
    .test('has-required-keys', 'One or more keys missing.', function(value) {
      return this.parent.key_list.every(key => value.includes(key.name));
    })
    .test('sms-length', 'The message will be too long.  Must be 160 characters or less.', function() {
      return this.parent.message_variant != 'sms' || this.parent.actualLength <= 160;
    })
    .required('Message is required.')
    .nullable(),
  subject: yup.string().when('message_variant', {
    is: 'email',
    then: yup.string().required('Subject is required.'),
  }),
  recipients: yup.string().when('needs_recipients', {
    is: true,
    then: yup.string().required('Recipient(s) are required.'),
  }),
});

EditNotificationModal.propTypes = {
  authenticity_token: PropTypes.string,
  onClose: PropTypes.func,
  updateMessage: PropTypes.func,
  setMessageIsCustomized: PropTypes.func,
  show: PropTypes.bool,
  initialMessage: PropTypes.object,
};

export default EditNotificationModal;
