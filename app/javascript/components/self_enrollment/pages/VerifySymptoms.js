import React from 'react';
import { PropTypes } from 'prop-types';
import { Card, Form } from 'react-bootstrap';

class VerifySymptoms extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      current: this.props.currentAssessmentState,
      noSymptomsCheckbox: false,
      selectedBoolSymptomCount: 0,
      errors: {},
    };
    this.handleChange = this.handleChange.bind(this);
    this.handleNoSymptomChange = this.handleNoSymptomChange.bind(this);
    this.updateBoolSymptomCount = this.updateBoolSymptomCount.bind(this);
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.current !== this.props.currentAssessmentState) {
      this.setState({
        current: this.props.currentAssessmentState,
      });
    }
  }

  handleChange(event) {
    let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    let current = this.state.current;
    let field_id = event.target.id.split('_idpre')[0];
    Object.values(current.symptoms).find(symp => symp.name === field_id).value = value;
    this.setState({ current: { ...current } }, () => {
      this.props.setAssessmentState({ ...this.state.current });
    });
    this.updateBoolSymptomCount();
  }

  handleNoSymptomChange(event) {
    let value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    this.setState({ noSymptomsCheckbox: value }, () => {
      // Make sure pre-selected options are cleared
      if (this.state.noSymptomsCheckbox) {
        let current = { ...this.state.current };
        for (const symptom in current?.symptoms) {
          if (current?.symptoms[parseInt(symptom)]?.type == 'BoolSymptom') {
            current.symptoms[parseInt(symptom)].value = false;
          }
          if (current?.symptoms[parseInt(symptom)]?.type == 'StringSymptom') {
            current.symptoms[parseInt(symptom)].value = '';
          }
        }
        this.setState({ current: current });
      }
    });
  }

  updateBoolSymptomCount() {
    let trueBoolSymptoms = this.state.current.symptoms.filter(s => {
      return s.type === 'BoolSymptom' && s.value;
    });
    this.setState({ selectedBoolSymptomCount: trueBoolSymptoms.length });
  }

  noSymptom() {
    let noSymptomsChecked = this.state.noSymptomsCheckbox;
    let boolSymptomsSelected = this.state.selectedBoolSymptomCount > 0 ? true : false;

    return (
      <Form.Check
        type="checkbox"
        checked={noSymptomsChecked}
        disabled={boolSymptomsSelected}
        label={<div>{<b>I am not experiencing any symptoms</b>}</div>}
        className="pb-4"
        onChange={this.handleNoSymptomChange}></Form.Check>
    );
  }

  boolSymptom = symp => {
    // null bool values will default to false
    symp.value = symp.value === true;
    let noSymptomsChecked = this.state.noSymptomsCheckbox;

    return (
      <Form.Check
        type="checkbox"
        id={`${symp.name}`}
        key={`key_${symp.name}`}
        checked={symp.value}
        disabled={noSymptomsChecked}
        label={
          <div>
            <b>{symp.name}</b>{' '}
          </div>
        }
        className="pb-2"
        onChange={this.handleChange}></Form.Check>
    );
  };

  floatSymptom = symp => {
    return (
      <Form.Row className="pt-3" key={`label_key_${symp.name}`}>
        <Form.Label className="nav-input-label" key={`label_key_${symp.name}`}>
          <b>{symp.name}</b>{' '}
        </Form.Label>
        <Form.Control
          size="lg"
          id={`${symp.name}`}
          key={`key_${symp.name}`}
          className="form-square"
          value={symp.value || ''}
          type="number"
          onChange={this.handleChange}
        />
      </Form.Row>
    );
  };

  stringSymptom = symp => {
    let noSymptomsChecked = this.state.noSymptomsCheckbox;
    return (
      <Form.Row className="pt-3" key={`label_key_${symp.name}`}>
        <Form.Label key={`label_key_${symp.name}`}>
          <div>
            <b>{symp.name}</b> {symp.notes ? ' ' + symp.notes : ''}
          </div>
        </Form.Label>
        <Form.Control
          size="lg"
          id={symp.name}
          key={`key_${symp.name}`}
          className="form-square"
          value={symp.value || ''}
          disabled={noSymptomsChecked}
          onChange={this.handleChange}
        />
      </Form.Row>
    );
  };

  render() {
    return (
      <React.Fragment>
        <Card className="mx-2 card-square">
          <Card.Header className="h5">Report Symptoms</Card.Header>
          <Card.Body>
            <Form.Row>
              <Form.Label className="nav-input-label pb-3">Please select all symptoms you are currently experiencing</Form.Label>
            </Form.Row>
            <Form.Row>
              <Form.Group className="pt-1">
                {this.noSymptom()}
                {this.state.current.symptoms.length > 0 &&
                  this.state.current.symptoms
                    .filter(x => {
                      return x.type === 'BoolSymptom';
                    })
                    .sort((a, b) => {
                      return a?.name?.localeCompare(b?.name);
                    })
                    .map(symp => this.boolSymptom(symp))}
                {this.state.current.symptoms.length > 0 &&
                  this.state.current.symptoms
                    .filter(x => {
                      return x.type === 'StringSymptom';
                    })
                    .map(symp => this.stringSymptom(symp))}
                {this.state.current.symptoms.length > 0 &&
                  this.state.current.symptoms
                    .filter(x => {
                      return x.type === 'FloatSymptom';
                    })
                    .map(symp => this.floatSymptom(symp))}
              </Form.Group>
            </Form.Row>
            <p></p>
            <div className="mt-5 d-flex justify-content-center">
              <a className="btn btn-outline-primary btn-lg btn-square px-5" onClick={() => this.props.submit()}>
                Submit
              </a>
            </div>
          </Card.Body>
        </Card>
      </React.Fragment>
    );
  }
}

VerifySymptoms.propTypes = {
  submit: PropTypes.func,
  validationError: PropTypes.string,
  validationReset: PropTypes.func,
  currentAssessmentState: PropTypes.object,
  setAssessmentState: PropTypes.func,
};

export default VerifySymptoms;
