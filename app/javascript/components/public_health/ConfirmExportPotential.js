import React from 'react';
import { PropTypes } from 'prop-types';
import { Button, Modal } from 'react-bootstrap';

class ConfirmExportPotential extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
    };
  }

  getUrl = () => {
    switch (this.props.exportType) {
      case 'Line list CSV':
        return `/export_potential/csv_linelist/${this.props.workflow}`;
      case 'Sara Alert Format':
        return `/export_potential/sara_alert_format/${this.props.workflow}`;
    }
  };

  submit = () => {
    this.setState({ loading: true }, () => {
      this.props.onStartExport(this.getUrl());
    });
  };

  render() {
    return (
      <Modal size="lg" className="confirm-export-modal-container" show={this.props.show} onHide={this.props.onCancel} centered>
        <Modal.Header>
          <Modal.Title>
            {`${this.props.exportType}${this.props.workflow ? ` (${this.props.workflow})` : ''}${this.props.presetName ? ` (${this.props.presetName})` : ''}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            After clicking <b>Start Export</b>, Sara Alert will gather all of the monitoree data that comprises your request and generate an export file. Sara
            Alert will then send your user account an email with a one-time download link. This process may take several minutes to complete, based on the
            amount of data present.
          </p>
          <p>
            NOTE: The system will store one of each type of export file. If you initiate another export of this file type, any old files will be overwritten and
            download links that have not been accessed will be invalid. Only one of each export type is allowed per user per hour.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary btn-square" onClick={this.props.onCancel}>
            Cancel
          </Button>
          <Button variant="primary btn-square" disabled={this.state.loading} onClick={this.submit}>
            {this.state.loading && (
              <React.Fragment>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>&nbsp;
              </React.Fragment>
            )}
            Start Export
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

ConfirmExportPotential.propTypes = {
  show: PropTypes.bool,
  exportType: PropTypes.string,
  presetName: PropTypes.string,
  workflow: PropTypes.string,
  onCancel: PropTypes.func,
  onStartExport: PropTypes.func,
};

export default ConfirmExportPotential;
