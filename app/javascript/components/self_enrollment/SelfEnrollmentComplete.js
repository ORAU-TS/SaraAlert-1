import React from 'react';
import { Card } from 'react-bootstrap';

class SelfEnrollmentComplete extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <React.Fragment>
        <Card className="mx-2 card-square">
          <Card.Header className="h5">Thank you!</Card.Header>
          <Card.Body>
            <p>Health Services will be reaching out to you shortly.</p>
          </Card.Body>
        </Card>
      </React.Fragment>
    );
  }
}

export default SelfEnrollmentComplete;
