import React from 'react';
import { PropTypes } from 'prop-types';
import { Card, Form } from 'react-bootstrap';
import * as yup from 'yup';

class ConfirmationCode extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      confirmation_code: '',
      errors: {},
    };
    this.validate = this.validate.bind(this);
  }

  handleChange = event => {
    let confirmation_code = event.target.value;
    this.setState(
      {
        confirmation_code: confirmation_code,
      },
      () => {
        this.props.setConfirmationCodeState(confirmation_code);
      }
    );
  };

  validate(callback) {
    let self = this;
    self.props.validationReset();
    schema
      .validate(this.state, { abortEarly: false })
      .then(function() {
        self.setState({ errors: {} }, () => {
          callback();
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
          <Card.Header className="h5">Enter Verification Code</Card.Header>
          <Card.Body>
            <p>
              Please enter the verification code that was sent to <b>{this.props.email}</b>
            </p>
            <Form.Group controlId="confirmation_code">
              <Form.Label>Verification Code</Form.Label>
              <Form.Control type="text" isInvalid={this.state.errors['confirmation_code']} value={this.state.confirmation_code} onChange={this.handleChange} />
              <Form.Control.Feedback className="d-block" type="invalid">
                {this.state.errors['confirmation_code']}
              </Form.Control.Feedback>
              {this.props.validationError && (
                <div className="py-2 text-danger">
                  {this.props.validationError}, or{' '}
                  <a href="#" onClick={this.props.requestNewCode}>
                    request another code
                  </a>
                  .
                </div>
              )}
            </Form.Group>
            <p>
              Didn’t get the email? Check your spam folder for an email from <b>{this.props.email}</b>. If necessary, you can{' '}
              <a href="#" onClick={this.props.requestNewCode}>
                submit your request again
              </a>
              . For questions or concerns please contact Health Services.
            </p>
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
  confirmation_code: yup
    .string()
    .required('Confirmation Code is required.')
    .min(7, 'Must be exactly 7 characters.')
    .max(7, 'Must be exactly 7 characters.')
    .nullable(),
});

ConfirmationCode.propTypes = {
  submit: PropTypes.func,
  setConfirmationCodeState: PropTypes.func,
  requestNewCode: PropTypes.func,
  confirmation_code: PropTypes.string,
  email: PropTypes.string,
  validationError: PropTypes.string,
  validationReset: PropTypes.func,
};

export default ConfirmationCode;
