import React from 'react';
import { PropTypes } from 'prop-types';
import { Card, Form } from 'react-bootstrap';
import * as yup from 'yup';
import ReCAPTCHA from 'react-google-recaptcha';

class SelfSignup extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      signupData: { ...this.props.signupData },
      errors: {},
    };
    this.validate = this.validate.bind(this);
  }

  handleChange = event => {
    let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    let signupData = this.state.signupData;
    this.setState(
      {
        signupData: { ...signupData, [event.target.id]: value },
      },
      () => {
        this.props.setSignupState(this.state.signupData);
      }
    );
  };

  validate(callback) {
    let self = this;
    let captcha = this.props.captchaRef.current.getValue();
    self.props.validationReset();
    schema
      .validate(this.state.signupData, { abortEarly: false })
      .then(function() {
        self.setState({ errors: {} }, () => {
          callback(captcha);
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
        <Card className="mx-2 card-square">
          <Card.Header className="h5">Self Enrollment Portal</Card.Header>
          <Card.Body>
            <p>
              Sara Alert Academic is a tool that enables campus health services to check in with you regarding your health needs. Enroll now to report symptoms.
            </p>
            <Form.Group controlId="first_name">
              <Form.Label>First Name</Form.Label>
              <Form.Control type="text" isInvalid={this.state.errors['first_name']} value={this.state.signupData.first_name} onChange={this.handleChange} />
              <Form.Control.Feedback className="d-block" type="invalid">
                {this.state.errors['first_name']}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="last_name">
              <Form.Label>Last Name</Form.Label>
              <Form.Control type="text" isInvalid={this.state.errors['last_name']} value={this.state.signupData.last_name} onChange={this.handleChange} />
              <Form.Control.Feedback className="d-block" type="invalid">
                {this.state.errors['last_name']}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="email">
              <Form.Label>College/University Email Address</Form.Label>
              <Form.Control type="text" isInvalid={this.state.errors['email']} value={this.state.signupData.email} onChange={this.handleChange} />
              <Form.Control.Feedback className="d-block" type="invalid">
                {this.state.errors['email']}
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group controlId="confirm_email">
              <Form.Label>Confirm College/University Email Address</Form.Label>
              <Form.Control
                type="text"
                isInvalid={this.state.errors['confirm_email']}
                value={this.state.signupData.confirm_email}
                onChange={this.handleChange}
              />
              <Form.Control.Feedback className="d-block" type="invalid">
                {this.state.errors['confirm_email']}
              </Form.Control.Feedback>
            </Form.Group>
            <p id="conditions_descrip">The following conditions apply to me (check all that apply):</p>
            <Form.Group className="form-check-group" controlId="exposed">
              <Form.Check
                type="checkbox"
                value={this.state.signupData.exposed}
                aria-describedby="conditions_descrip"
                label="I have been exposed."
                onChange={this.handleChange}
              />
            </Form.Group>
            <Form.Group className="form-check-group" controlId="tested_positive">
              <Form.Check
                type="checkbox"
                value={this.state.signupData.tested_positive}
                aria-describedby="conditions_descrip"
                label="I have tested positive."
                onChange={this.handleChange}
              />
            </Form.Group>
            <Form.Group className="form-check-group" controlId="concerning_symptoms">
              <Form.Check
                type="checkbox"
                value={this.state.signupData.concerning_symptoms}
                aria-describedby="conditions_descrip"
                label="I have concerning symptoms."
                onChange={this.handleChange}
              />
            </Form.Group>
            <ReCAPTCHA className="mt-3" ref={this.props.captchaRef} sitekey={this.props.recaptcha_sitekey} />
            <Form.Control.Feedback className="d-block" type="invalid">
              {this.props.validationError}
            </Form.Control.Feedback>
            <div className="mt-5 d-flex justify-content-center">
              <a className="btn btn-outline-primary btn-lg btn-square px-5" onClick={() => this.validate(this.props.submit)}>
                Submit
              </a>
            </div>
          </Card.Body>
        </Card>
      </React.Fragment>
    );
  }
}

var schema = yup.object().shape({
  first_name: yup
    .string()
    .required('First Name is required.')
    .nullable(),
  last_name: yup
    .string()
    .required('Last Name is required.')
    .nullable(),
  email: yup
    .string()
    .email('Please enter a valid email address.')
    .required('College Email Address is required.')
    .nullable(),
  confirm_email: yup
    .string()
    .oneOf([yup.ref('email'), null], 'Email addresses do not match.')
    .nullable(),
});

SelfSignup.propTypes = {
  submit: PropTypes.func,
  setSignupState: PropTypes.func,
  signupData: PropTypes.object,
  validationError: PropTypes.string,
  validationReset: PropTypes.func,
  recaptcha_sitekey: PropTypes.string,
  captchaRef: PropTypes.object,
};

export default SelfSignup;
