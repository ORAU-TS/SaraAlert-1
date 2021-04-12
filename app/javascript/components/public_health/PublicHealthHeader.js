import React from 'react';
import { PropTypes } from 'prop-types';
import { Button, ButtonGroup, Dropdown, DropdownButton, Form, Modal, ProgressBar, Tooltip, OverlayTrigger } from 'react-bootstrap';
import axios from 'axios';

import Export from './Export';
import ExportPotential from './ExportPotential';
import Import from './Import';
import ImportPotential from './ImportPotential';
import confirmDialog from '../util/ConfirmDialog';

class PublicHealthHeader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      counts: {},
      showUploadModal: false,
      showImportModal: false,
      uploading: false,
    };
  }

  componentDidMount() {
    axios.get('/public_health/patients/counts/workflow').then(response => {
      if (response && response.data) {
        this.setState({ counts: response.data });
      }
    });
  }

  selectFileForUpload(event, type) {
    this.setState({ file: event.target.files[0], fileType: type });
  }

  uploadFile = () => {
    if (this.state.file && this.state.fileType) {
      this.setState({ uploading: true }, () => {
        axios.defaults.headers.common['X-CSRF-Token'] = this.props.authenticity_token;
        const config = { headers: { 'content-type': 'multipart/form-data' } };
        const formData = new FormData();
        let url = '';
        formData.append('file', this.state.file);
        if (this.props.workflow === 'self_enrolled') {
          url = `/import_potential/self_enrolled/sara_alert_format`;
        } else {
          url = `/import/${this.props.workflow}/${this.state.fileType === 'epix' ? 'epix' : 'sara_alert_format'}`;
        }
        axios.post(url, formData, config).then(response => {
          this.setState({
            uploading: false,
            importData: response.data,
            showUploadModal: false,
            showImportModal: true,
          });
        });
      });
    }
  };

  renderImportModal() {
    return (
      <Modal
        dialogClassName={this.props.workflow === 'self-enrolled' ? 'modal-import-potential' : 'modal-import'}
        backdrop={this.state.importData?.errors?.length > 0 ? true : 'static'}
        scrollable="true"
        show={this.state.showImportModal}
        onHide={async () => {
          if (this.state.importData.errors.length > 0) {
            this.setState({ showImportModal: false, importType: null, importData: null });
          } else if (this.importComponent.state.progress > 0) {
            this.importComponent.stopImport('X');
          } else if (this.importComponent.state.accepted.length > 0) {
            const confirmText = 'You are about to stop the import process. Are you sure you want to do this?';
            const options = {
              title: 'Stop Import',
              okLabel: 'Proceed to Stop',
              cancelLabel: 'Return to Import',
              additionalNote: 'Records imported prior to clicking "X" will not be deleted from the system.',
            };
            if (await confirmDialog(confirmText, options)) {
              if (this.props.workflow === 'isolation') {
                location.href = '/public_health/isolation';
              } else if (this.props.workflow === 'self_enrolled') {
                location.href = '/public_health/self_enrolled';
              } else {
                location.href = '/public_health';
              }
            }
          } else {
            const confirmText = 'You are about to cancel the import process. Are you sure you want to do this?';
            const options = {
              title: 'Cancel Import',
              okLabel: 'Proceed to Cancel',
              cancelLabel: 'Return to Import',
            };
            if (await confirmDialog(confirmText, options)) {
              this.setState({ showImportModal: false, importType: null, importData: null });
            }
          }
        }}>
        <Modal.Header closeButton>
          {this.state.importData && (
            <React.Fragment>
              {this.state.importData.errors.length > 0 && (
                <Modal.Title className="h5">{this.state.importType === 'epix' ? 'Import Epi-X' : 'Import Sara Alert Format'} (error)</Modal.Title>
              )}
              {this.state.importData.errors.length === 0 && (
                <Modal.Title className="h5">
                  {this.state.importType === 'epix' ? 'Import Epi-X' : 'Import Sara Alert Format'} ({this.props.workflow})
                </Modal.Title>
              )}
            </React.Fragment>
          )}
        </Modal.Header>
        <Modal.Body>
          {this.state.importData && this.state.importData.patients && this.state.importData.errors && this.props.workflow !== 'self_enrolled' && (
            <Import
              workflow={this.props.workflow}
              patients={this.state.importData.patients}
              errors={this.state.importData.errors}
              authenticity_token={this.props.authenticity_token}
              ref={instance => {
                this.importComponent = instance;
              }}
            />
          )}
          {this.state.importData && this.state.importData.patients && this.state.importData.errors && this.props.workflow === 'self_enrolled' && (
            <ImportPotential
              workflow={this.props.workflow}
              patients={this.state.importData.patients}
              errors={this.state.importData.errors}
              authenticity_token={this.props.authenticity_token}
              ref={instance => {
                this.importComponent = instance;
              }}
            />
          )}
        </Modal.Body>
      </Modal>
    );
  }

  renderUploadModal() {
    return (
      <Modal size="md" show={this.state.showUploadModal} onHide={() => this.setState({ showUploadModal: false, importType: null })}>
        <Modal.Header closeButton>
          {this.state.importType === 'epix' && <Modal.Title as="h5">{`Import Epi-X (${this.props.workflow})`}</Modal.Title>}
          {this.state.importType === 'saf' && <Modal.Title as="h5">{`Import Sara Alert Academic Format (${this.props.workflow})`}</Modal.Title>}
        </Modal.Header>
        <Modal.Body>
          {this.state.importType === 'saf' && this.props.workflow !== 'self_enrolled' && (
            <div className="mb-3">
              <a href="/Sara%20Alert%20Import%20Format.xlsx">Download formatting guidance</a>
            </div>
          )}
          {this.state.importType === 'saf' && this.props.workflow === 'self_enrolled' && (
            <div className="mb-3">
              <a href="/Sara%20Alert%20Self-Enroll%20Import%20Format.xlsx">Download formatting guidance</a>
            </div>
          )}
          <Form inline>
            <Form.File>
              <Form.File.Input onChange={event => this.selectFileForUpload(event, this.state.importType)}></Form.File.Input>
            </Form.File>
            <Button className="float-right ml-auto" disabled={!this.state.file} onClick={this.uploadFile}>
              <i className="fas fa-upload"></i> Upload
            </Button>
          </Form>
          {this.state.uploading && <ProgressBar animated striped now={100} className="mt-3" />}
        </Modal.Body>
      </Modal>
    );
  }

  renderDisabledTooltip = props => <Tooltip {...props}>This feature is currently disabled.</Tooltip>;

  render() {
    return (
      <React.Fragment>
        <ButtonGroup>
          {this.props.abilities.enrollment && this.props.workflow !== 'self_enrolled' && (
            <Button variant="primary" className="ml-2 mb-4" href={this.props.workflow === 'exposure' ? '/patients/new' : '/patients/new?isolation=true'}>
              {this.props.workflow === 'exposure' && (
                <span>
                  <i className="fas fa-plus-square"></i> Enroll New Monitoree
                </span>
              )}
              {this.props.workflow === 'isolation' && (
                <span>
                  <i className="fas fa-plus-square"></i> Enroll New Case
                </span>
              )}
            </Button>
          )}
          {this.props.abilities.export && this.props.workflow !== 'self_enrolled' && (
            <Export
              authenticity_token={this.props.authenticity_token}
              jurisdiction_paths={this.props.jurisdiction_paths}
              jurisdiction={this.props.jurisdiction}
              tabs={this.props.tabs}
              workflow={this.props.workflow}
              query={this.props.query}
              all_monitorees_count={this.state.counts.exposure + this.state.counts.isolation}
              current_monitorees_count={this.props.current_monitorees_count}
              custom_export_options={this.props.custom_export_options}
            />
          )}
          {this.props.abilities.export && this.props.workflow === 'self_enrolled' && (
            <ExportPotential
              authenticity_token={this.props.authenticity_token}
              jurisdiction_paths={this.props.jurisdiction_paths}
              jurisdiction={this.props.jurisdiction}
              tabs={this.props.tabs}
              workflow={this.props.workflow}
              query={this.props.query}
              all_monitorees_count={this.state.counts.exposure + this.state.counts.isolation}
              current_monitorees_count={this.props.current_monitorees_count}
              custom_export_options={this.props.custom_export_options}
            />
          )}

          {this.props.abilities.import && this.props.workflow !== 'self_enrolled' && (
            <DropdownButton
              as={ButtonGroup}
              size="md"
              className="ml-2 mb-4"
              title={
                <React.Fragment>
                  <i className="fas fa-upload"></i> Import{' '}
                </React.Fragment>
              }>
              <OverlayTrigger placement="right" delay={{ show: 250, hide: 400 }} overlay={this.renderDisabledTooltip}>
                <Dropdown.Item>Epi-X ({this.props.workflow})</Dropdown.Item>
              </OverlayTrigger>
              <Dropdown.Item onClick={() => this.setState({ importType: 'saf', showUploadModal: true })}>
                Sara Alert Academic Format ({this.props.workflow})
              </Dropdown.Item>
            </DropdownButton>
          )}
          {this.props.abilities.import && this.props.workflow === 'self_enrolled' && (
            <Button size="md" className="ml-2 mb-4" onClick={() => this.setState({ importType: 'saf', showUploadModal: true })} title="Import">
              <i className="fas fa-upload"></i> Import
            </Button>
          )}
        </ButtonGroup>

        <ButtonGroup className="float-right mb-4 mr-2">
          <Button variant={this.props.workflow === 'self_enrolled' ? 'primary' : 'outline-primary'} href="/public_health/self_enrolled">
            <i className="fas fa-people-arrows"></i> Self Enrollment{' '}
            {this.state.counts.self_enrolled !== undefined && <span id="selfEnrolledCount">({this.state.counts.self_enrolled})</span>}
          </Button>
          <Button variant={this.props.workflow === 'exposure' ? 'primary' : 'outline-primary'} href="/public_health">
            <i className="fas fa-people-arrows"></i> Exposure Monitoring{' '}
            {this.state.counts.exposure !== undefined && <span id="exposureCount">({this.state.counts.exposure})</span>}
          </Button>
          <Button variant={this.props.workflow === 'isolation' ? 'primary' : 'outline-primary'} href="/public_health/isolation">
            <i className="fas fa-house-user"></i> Isolation Monitoring{' '}
            {this.state.counts.isolation !== undefined && <span id="isolationCount">({this.state.counts.isolation})</span>}
          </Button>
        </ButtonGroup>

        {this.renderUploadModal()}
        {this.renderImportModal()}
      </React.Fragment>
    );
  }
}

PublicHealthHeader.propTypes = {
  authenticity_token: PropTypes.string,
  jurisdiction_paths: PropTypes.object,
  workflow: PropTypes.oneOf(['exposure', 'isolation', 'self_enrolled']),
  jurisdiction: PropTypes.object,
  tabs: PropTypes.object,
  abilities: PropTypes.exact({
    analytics: PropTypes.bool,
    enrollment: PropTypes.bool,
    export: PropTypes.bool,
    import: PropTypes.bool,
  }),
  query: PropTypes.object,
  current_monitorees_count: PropTypes.number,
  custom_export_options: PropTypes.object,
};

export default PublicHealthHeader;
