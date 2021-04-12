import React from 'react';
import { PropTypes } from 'prop-types';
import { ButtonGroup, DropdownButton, Dropdown } from 'react-bootstrap';

import { toast } from 'react-toastify';
import axios from 'axios';

import ConfirmExportPotential from './ConfirmExportPotential';
import reportError from '../util/ReportError';

class ExportPotential extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showCSVModal: false,
      showSaraFormatModal: false,
    };
  }

  submit = endpoint => {
    axios.defaults.headers.common['X-CSRF-Token'] = this.props.authenticity_token;
    axios({
      method: 'get',
      url: window.BASE_PATH + endpoint,
    })
      .then(() => {
        toast.success('Export has been initiated!');
        this.setState({
          showCSVModal: false,
          showSaraFormatModal: false,
        });
      })
      .catch(err => {
        reportError(err?.response?.data?.message ? err.response.data.message : err, false);
        this.setState({
          showCSVModal: false,
          showSaraFormatModal: false,
        });
      });
  };

  render() {
    return (
      <React.Fragment>
        <DropdownButton
          as={ButtonGroup}
          size="md"
          className="ml-2 mb-4"
          title={
            <React.Fragment>
              <i className="fas fa-download"></i> Export{' '}
            </React.Fragment>
          }>
          <Dropdown.Item onClick={() => this.setState({ showCSVModal: true })}>Line list CSV ({this.props.workflow})</Dropdown.Item>
          <Dropdown.Item onClick={() => this.setState({ showSaraFormatModal: true })}>Sara Alert Academic Format ({this.props.workflow})</Dropdown.Item>
        </DropdownButton>
        {this.state.showCSVModal && (
          <ConfirmExportPotential
            show={this.state.showCSVModal}
            exportType={'Line list CSV'}
            workflow={this.props.workflow}
            onCancel={() => this.setState({ showCSVModal: false })}
            onStartExport={this.submit}
          />
        )}
        {this.state.showSaraFormatModal && (
          <ConfirmExportPotential
            show={this.state.showSaraFormatModal}
            exportType={'Sara Alert Format'}
            workflow={this.props.workflow}
            onCancel={() => this.setState({ showSaraFormatModal: false })}
            onStartExport={this.submit}
          />
        )}
      </React.Fragment>
    );
  }
}

ExportPotential.propTypes = {
  authenticity_token: PropTypes.string,
  jurisdiction_paths: PropTypes.object,
  jurisdiction: PropTypes.object,
  tabs: PropTypes.object,
  workflow: PropTypes.string,
  query: PropTypes.object,
  all_monitorees_count: PropTypes.number,
  current_monitorees_count: PropTypes.number,
  custom_export_options: PropTypes.object,
};

export default ExportPotential;
