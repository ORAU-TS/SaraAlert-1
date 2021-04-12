import React from 'react';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import { Card, Form, Col, Button } from 'react-bootstrap';
import reportError from '../util/ReportError';
import * as yup from 'yup';

class ContacUsForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      errors: {},
      data: {
        name: '',
        email: '',
        message: '',
      },
      success: false,
    };
    this.handleInputChange = this.handleInputChange.bind(this);
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    let updatedData = { ...this.state.data };
    updatedData[name] = value;

    this.setState({
      data: updatedData,
    });
  }

  validate = callback => {
    const self = this;
    schema
      .validate(this.state.data, { abortEarly: false })
      .then(function() {
        console.log('valid');
        self.setState({ errors: {} }, () => {
          callback(self);
        });
      })
      .catch(err => {
        console.log('invalid');
        if (err && err.inner) {
          let issues = {};
          for (var issue of err.inner) {
            issues[issue['path']] = issue['errors'];
          }
          self.setState({ errors: issues });
        }
      });
  };

  handleSubmit(self) {
    console.log('submit');
    window.onbeforeunload = null;
    axios.defaults.headers.common['X-CSRF-Token'] = self.props.authenticity_token;
    let data = new Object({
      contact_us: {
        name: self.state.data.name,
        email: self.state.data.email,
        message: self.state.data.message,
      },
    });

    axios({
      method: 'post',
      url: 'contact_us/send',
      data: data,
    })
      .then(() => {
        self.setState({
          success: true,
        });
      })
      .catch(err => {
        reportError(err);
      });
  }

  render() {
    return (
      <React.Fragment>
        <Card className="card-square">
          <Card.Header className="text-left h5">Contact Us</Card.Header>
          <Card.Body>
            {!this.state.success && (
              <Form>
                <Form.Row className="pt-2">
                  <Form.Group as={Col} controlId="workflow">
                    <Form.Label className="nav-input-label">NAME</Form.Label>
                    <Form.Control
                      isInvalid={this.state.errors['name']}
                      name="name"
                      placeholder="Your Name"
                      aria-label="Your Name"
                      onChange={this.handleInputChange}
                      value={this.state.data.name}
                    />
                  </Form.Group>
                </Form.Row>
                <Form.Row className="pt-2">
                  <Form.Group as={Col} controlId="workflow">
                    <Form.Label className="nav-input-label">EMAIL ADDRESS</Form.Label>
                    <Form.Control
                      isInvalid={this.state.errors['email']}
                      name="email"
                      placeholder="somewhere@example.com"
                      aria-label="Email Address"
                      onChange={this.handleInputChange}
                      value={this.state.data.email}
                    />
                  </Form.Group>
                </Form.Row>
                <Form.Row className="pt-2">
                  <Form.Group as={Col} controlId="workflow">
                    <Form.Label className="nav-input-label">MESSAGE</Form.Label>
                    <Form.Control
                      isInvalid={this.state.errors['message']}
                      as="textarea"
                      name="message"
                      aria-label="Your Message"
                      onChange={this.handleInputChange}
                      value={this.state.data.message}
                    />
                  </Form.Group>
                </Form.Row>
                <Button
                  variant="primary"
                  onClick={() => {
                    this.validate(this.handleSubmit);
                  }}>
                  Send Message
                </Button>
              </Form>
            )}
            {this.state.success && <Card.Text>Thank you for your submission! We will get back to you shortly.</Card.Text>}
          </Card.Body>
        </Card>
      </React.Fragment>
    );
  }
}

const schema = yup.object().shape({
  name: yup
    .string()
    .required('Please enter a Name.')
    .nullable(),
  email: yup
    .string()
    .required('Please enter an Email Address.')
    .email()
    .nullable(),
  message: yup
    .string()
    .required('Please enter a Message Address.')
    .nullable(),
});

export default ContacUsForm;
