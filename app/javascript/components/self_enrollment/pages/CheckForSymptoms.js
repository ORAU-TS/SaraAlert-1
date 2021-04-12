import React from 'react';
import { PropTypes } from 'prop-types';
import { Card } from 'react-bootstrap';

class CheckForSymptoms extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <React.Fragment>
        <Card className="mx-2 card-square">
          <Card.Header className="h5">Verify Complete</Card.Header>
          <Card.Body>
            <p>Thank you for verifying your account.</p>
            <p>If you would like, you can report any symptoms you are experiencing.</p>
            <a className="btn btn-outline-primary btn-lg btn-square px-5" onClick={this.props.gotoVerify}>
              Report Symptoms
            </a>
            <a className="btn btn-outline-primary btn-lg btn-square px-5 float-right" onClick={this.props.gotoFinish}>
              Finish
            </a>
          </Card.Body>
        </Card>
      </React.Fragment>
    );
  }
}

CheckForSymptoms.propTypes = {
  gotoFinish: PropTypes.func,
  gotoVerify: PropTypes.func,
};

export default CheckForSymptoms;
