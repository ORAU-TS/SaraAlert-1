import React from 'react';
import PropTypes from 'prop-types';
import { Carousel } from 'react-bootstrap';
import 'react-toastify/dist/ReactToastify.css';
import SelfSignup from './pages/SelfSignup';
import ConfirmationCode from './pages/ConfirmationCode';
import CheckForSymptoms from './pages/CheckForSymptoms';
import VerifySymptoms from './pages/VerifySymptoms';
import axios from 'axios';
import reportError from '../util/ReportError';

const SelfSignupIndex = 0;
const ConfirmationCodeIndex = 1;
const CheckForSymptomsIndex = 2;
const VerifySymptomsIndex = 3;

class SelfEnrollment extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      index: SelfSignupIndex,
      validationError: '',
      signupData: {
        first_name: '',
        last_name: '',
        email: '',
        confirm_email: '',
        exposed: false,
        tested_positive: false,
        concerning_symptoms: false,
      },
      confirmation_code: '',
      patientId: '',
      jurisdictionId: '',
      thresholdHash: '',
      assessmentState: { symptoms: {} },
    };
    this.validationReset = this.validationReset.bind(this);
    this.gotoStep = this.gotoStep.bind(this);

    this.setSignupState = this.setSignupState.bind(this);
    this.selfEnroll = this.selfEnroll.bind(this);

    this.setConfirmationCodeState = this.setConfirmationCodeState.bind(this);
    this.confirmCode = this.confirmCode.bind(this);
    this.requestNewCode = this.requestNewCode.bind(this);
    this.requestAssessment = this.requestAssessment.bind(this);
    this.gotoVerifySymptoms = this.gotoVerifySymptoms.bind(this);
    this.captchaRef = React.createRef();
    this.setAssessmentState = this.setAssessmentState.bind(this);
    this.saveAssessment = this.saveAssessment.bind(this);
    this.submitEnrollment = this.submitEnrollment.bind(this);
    this.submitNoSymptoms = this.submitNoSymptoms.bind(this);
  }

  componentDidMount() {
    window.onbeforeunload = function() {
      return 'All progress will be lost. Are you sure?';
    };
  }

  setSignupState(signupData) {
    let oldSignupData = this.state.signupData;
    this.setState({
      signupData: { ...oldSignupData, ...signupData },
    });
  }

  selfEnroll(captchaToken) {
    this.setState({ validationError: '' });
    axios.defaults.headers.common['X-CSRF-Token'] = this.props.authenticity_token;
    let data = {
      potential_patient: { ...this.state.signupData },
      captchaToken: captchaToken,
    };
    axios({
      method: 'post',
      url: window.BASE_PATH + '/r/signup',
      data: data,
    })
      .then(response => {
        if (response.data && response.data.error) {
          this.captchaRef.current.reset();
          this.setState({ validationError: response.data.error });
        } else {
          this.gotoStep(ConfirmationCodeIndex);
        }
      })
      .catch(err => {
        reportError(err);
      });
  }

  setConfirmationCodeState(confirmationCode) {
    this.setState({
      confirmation_code: confirmationCode,
    });
  }

  confirmCode() {
    this.setState({ validationError: '' });
    axios.defaults.headers.common['X-CSRF-Token'] = this.props.authenticity_token;
    let data = {
      confirm_patient: {
        email: this.state.signupData.email,
        confirmation_code: this.state.confirmation_code,
      },
    };
    axios({
      method: 'post',
      url: window.BASE_PATH + '/r/confirm_code',
      data: data,
    })
      .then(response => {
        if (response.data && response.data.error) {
          this.setState({ validationError: response.data.error });
        } else {
          this.setState({
            jurisdictionId: response.data.jurisdiction_id,
            patientId: response.data.patient_id,
          });
          window.onbeforeunload = null;
          this.gotoStep(CheckForSymptomsIndex);
        }
      })
      .catch(err => {
        reportError(err);
      });
  }

  requestNewCode(event) {
    event.preventDefault();
    this.captchaRef.current.reset();
    this.gotoStep(SelfSignupIndex);
  }

  setAssessmentState(assessmentState) {
    let currentAssessmentState = this.state.assessmentState;
    this.setState({ assessmentState: { ...currentAssessmentState, ...assessmentState } });
  }

  /** Capture assessment data and submit with enrollee */
  saveAssessment() {
    var assessmentData = this.state.assessmentState;
    assessmentData.threshold_hash = this.state.thresholdHash;
    this.submitEnrollment(assessmentData);
  }

  /** Fetch assessment data to populate symptoms and navigate */
  requestAssessment() {
    this.setState({ validationError: '' });
    axios.defaults.headers.common['X-CSRF-Token'] = this.props.authenticity_token;
    let data = { jurisdiction_id: this.state.jurisdictionId };
    axios({
      method: 'post',
      url: window.BASE_PATH + '/r/assessment_data',
      data: data,
    })
      .then(response => {
        if (response.data && response.data.error) {
          this.setState({ validationError: response.data.error });
        } else {
          this.setState({
            assessmentState: { symptoms: response.data.symptoms },
            thresholdHash: response.data.threshold_hash,
          });
          this.gotoStep(VerifySymptomsIndex);
        }
      })
      .catch(err => {
        reportError(err);
      });
  }

  /** Submit self-enrollee data */
  submitEnrollment(assessmentData) {
    const data = { patient_id: this.state.patientId };
    if (Object.keys(assessmentData).length > 0) {
      data.assessment = assessmentData;
    }
    axios.defaults.headers.common['X-CSRF-Token'] = this.props.authenticity_token;
    axios({
      method: 'post',
      url: window.BASE_PATH + '/r/submit_enrollee',
      data: data,
    })
      .then(response => {
        if (response.data && response.data.error) {
          this.setState({ validationError: response.data.error });
        } else {
          window.onbeforeunload = null;
          location.href = window.BASE_PATH + '/r/self_enrollment_complete';
        }
      })
      .catch(err => {
        reportError(err);
      });
  }

  /** submit self-enrollee with no symptoms */
  submitNoSymptoms() {
    this.submitEnrollment({});
  }

  validationReset() {
    this.setState({ validationError: '' });
  }

  gotoStep(targetIndex) {
    this.validationReset();
    this.setState({ index: targetIndex });
  }

  /** navigate to symptoms checklist */
  gotoVerifySymptoms() {
    this.requestAssessment();
  }

  render() {
    return (
      <React.Fragment>
        <div ref={this.scrollTarget}>
          <Carousel slide={false} controls={false} indicators={false} interval={null} keyboard={false} activeIndex={this.state.index} onSelect={() => {}}>
            <Carousel.Item>
              <SelfSignup
                submit={this.selfEnroll}
                validationError={this.state.validationError}
                validationReset={this.validationReset}
                setSignupState={this.setSignupState}
                signupData={this.state.signupData}
                recaptcha_sitekey={this.props.recaptcha_sitekey}
                captchaRef={this.captchaRef}
              />
            </Carousel.Item>
            <Carousel.Item>
              <ConfirmationCode
                submit={this.confirmCode}
                validationError={this.state.validationError}
                validationReset={this.validationReset}
                email={this.state.signupData.email}
                setConfirmationCodeState={this.setConfirmationCodeState}
                confirmationCode={this.state.confirmationCode}
                requestNewCode={this.requestNewCode}
              />
            </Carousel.Item>
            <Carousel.Item>
              <CheckForSymptoms gotoFinish={this.submitNoSymptoms} gotoVerify={this.gotoVerifySymptoms} />
            </Carousel.Item>
            <Carousel.Item>
              <VerifySymptoms
                submit={this.saveAssessment}
                validationError={this.state.validationError}
                validationReset={this.validationReset}
                currentAssessmentState={this.state.assessmentState}
                setAssessmentState={this.setAssessmentState}
              />
            </Carousel.Item>
          </Carousel>
        </div>
      </React.Fragment>
    );
  }
}

SelfEnrollment.propTypes = {
  authenticity_token: PropTypes.string,
  recaptcha_sitekey: PropTypes.string,
};

export default SelfEnrollment;
