import React from 'react';
import { Button, Modal } from 'react-bootstrap';
import { PropTypes } from 'prop-types';

class ConfirmRevertModal extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <React.Fragment>
        <Modal show={this.props.show} onHide={this.hide} dialogClassName="modal-am" aria-labelledby="contained-modal-title-vcenter" centered>
          <Modal.Header closeButton>
            <Modal.Title>Confirm</Modal.Title>
          </Modal.Header>
          <Modal.Body>Are you sure you want to revert to the default message text?</Modal.Body>
          <Modal.Footer>
            <Button variant="primary btn-square" onClick={this.props.revertConfirmed}>
              Revert
            </Button>
            <Button variant="secondary btn-square" onClick={this.props.onClose}>
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </React.Fragment>
    );
  }
}

ConfirmRevertModal.propTypes = {
  onClose: PropTypes.func,
  revertConfirmed: PropTypes.func,
  show: PropTypes.bool,
};

export default ConfirmRevertModal;
