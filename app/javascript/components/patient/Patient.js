import React from 'react';
import { PropTypes } from 'prop-types';
import { Button, Col, Collapse, Form, Row, Table } from 'react-bootstrap';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

import BadgeHOH from '../util/BadgeHOH';
import ChangeHOH from '../subject/ChangeHOH';
import MoveToHousehold from '../subject/MoveToHousehold';
import RemoveFromHousehold from '../subject/RemoveFromHousehold';
import InfoTooltip from '../util/InfoTooltip';
import { HasOverlap } from '../util/Computed';

import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';

import NotificationsModal from './NotificationsModal';

class Patient extends React.Component {
  constructor(props) {
    super(props);
    const successMessage = sessionStorage.getItem('successMessage');
    sessionStorage.removeItem('successMessage');
    this.state = {
      expanded: !props.hideBody,
      expandNotes: false,
      expandArrivalNotes: false,
      expandPlannedTravelNotes: false,
      showNotificationsModal: !!successMessage,
    };

    if (successMessage) {
      toast.success(successMessage);
      sessionStorage.removeItem('successMessage');
    }
  }

  openNotificationsModal = () => {
    this.setState({ showNotificationsModal: true });
  };

  closeNotificationsModal = showToastr => {
    if (showToastr) {
      toast.success('Notifications Sent', {
        position: toast.POSITION.TOP_CENTER,
      });
    }
    this.setState({ showNotificationsModal: false });
  };

  formatPhoneNumber(phone) {
    const match = phone
      .replace('+1', '')
      .replace(/\D/g, '')
      .match(/^(\d{3})(\d{3})(\d{4})$/);
    return match ? +match[1] + '-' + match[2] + '-' + match[3] : '';
  }

  formatRace = () => {
    let raceArray = [];
    if (this.props.details.white) {
      raceArray.push('White');
    }
    if (this.props.details.black_or_african_american) {
      raceArray.push('Black or African American');
    }
    if (this.props.details.asian) {
      raceArray.push('Asian');
    }
    if (this.props.details.american_indian_or_alaska_native) {
      raceArray.push('American Indian or Alaska Native');
    }
    if (this.props.details.native_hawaiian_or_other_pacific_islander) {
      raceArray.push('Native Hawaiian or Other Pacific Islander');
    }
    return <span>{raceArray.length === 0 ? '--' : raceArray.join(', ')}</span>;
  };

  render() {
    if (!this.props.details) {
      return <React.Fragment>No monitoree details to show.</React.Fragment>;
    }

    const showDomesticAddress =
      this.props.details.address_line_1 ||
      this.props.details.address_line_2 ||
      this.props.details.address_city ||
      this.props.details.address_state ||
      this.props.details.address_zip ||
      this.props.details.address_county;
    const showMonitoredAddress =
      this.props.details.monitored_address_line_1 ||
      this.props.details.monitored_address_line_2 ||
      this.props.details.monitored_address_city ||
      this.props.details.monitored_address_state ||
      this.props.details.monitored_address_zip ||
      this.props.details.monitored_address_county;
    const showForeignAddress =
      this.props.details.foreign_address_line_1 ||
      this.props.details.foreign_address_line_2 ||
      this.props.details.foreign_address_line_3 ||
      this.props.details.foreign_address_city ||
      this.props.details.foreign_address_zip ||
      this.props.details.foreign_address_country;
    const showForeignMonitoringAddress =
      this.props.details.foreign_monitored_address_line_1 ||
      this.props.details.foreign_monitored_address_line_2 ||
      this.props.details.foreign_monitored_address_city ||
      this.props.details.foreign_monitored_address_state ||
      this.props.details.foreign_monitored_address_zip ||
      this.props.details.foreign_monitored_address_county;
    const showArrivalSection =
      this.props.details.port_of_origin ||
      this.props.details.date_of_departure ||
      this.props.details.flight_or_vessel_carrier ||
      this.props.details.flight_or_vessel_number ||
      this.props.details.port_of_entry_into_usa ||
      this.props.details.date_of_arrival;
    const showPlannedTravel =
      this.props.details.additional_planned_travel_type ||
      this.props.details.additional_planned_travel_destination_country ||
      this.props.details.additional_planned_travel_destination_state ||
      this.props.details.additional_planned_travel_port_of_departure ||
      this.props.details.additional_planned_travel_start_date ||
      this.props.details.additional_planned_travel_end_date;
    const showPotentialExposureInfo =
      this.props.details.last_date_of_exposure || this.props.details.potential_exposure_location || this.props.details.potential_exposure_country;
    const showRiskFactors =
      this.props.details.contact_of_known_case ||
      this.props.details.member_of_a_common_exposure_cohort ||
      this.props.details.travel_to_affected_country_or_area ||
      this.props.details.was_in_health_care_facility_with_known_cases ||
      this.props.details.laboratory_personnel ||
      this.props.details.healthcare_personnel ||
      this.props.details.crew_on_passenger_or_cargo_flight;

    return (
      <React.Fragment>
        <Row id="monitoree-details-header">
          <Col sm={12}>
            <h3>
              <span className="pr-2">
                {`${this.props.details.first_name ? this.props.details.first_name : ''}${
                  this.props.details.middle_name ? ' ' + this.props.details.middle_name : ''
                }${this.props.details.last_name ? ' ' + this.props.details.last_name : ''}`}
              </span>
              {this.props?.dependents && this.props?.dependents?.length > 0 && <BadgeHOH patientId={String(this.props.details.id)} location={'right'} />}
            </h3>
          </Col>
          <Col sm={12}>
            <div className="jurisdiction-user-box">
              <div id="jurisdiction-path">
                <b>
                  <span className="d-none d-md-inline">Assigned</span> Jurisdiction:
                </b>{' '}
                {this.props.jurisdiction_path || '--'}
              </div>
              <div id="assigned-user">
                <b>Assigned User:</b> {this.props.details.assigned_user || '--'}
              </div>
            </div>
          </Col>
        </Row>
        <Row>
          <Col id="identification" lg={14} xl={12} className="col-xxxl-10">
            <div className="section-header">
              <h4 className="section-title">Identification</h4>
              <div className="edit-link">
                {this.props.goto && (
                  <Button variant="link" id="edit-identification-btn" className="py-0" onClick={() => this.props.goto(0)} aria-label="Edit Identification">
                    Edit
                  </Button>
                )}
              </div>
            </div>
            <Row>
              <Col sm={10} className="item-group">
                <div>
                  <b>DOB:</b> <span>{this.props.details.date_of_birth && moment(this.props.details.date_of_birth, 'YYYY-MM-DD').format('MM/DD/YYYY')}</span>
                </div>
                <div>
                  <b>Age:</b> <span>{this.props.details.age || '--'}</span>
                </div>
                <div>
                  <b>Language:</b> <span>{this.props.details.primary_language || '--'}</span>
                </div>
                <div>
                  <b>State/Local ID:</b> <span>{this.props.details.user_defined_id_statelocal || '--'}</span>
                </div>
                <div>
                  <b>CDC ID:</b> <span>{this.props.details.user_defined_id_cdc || '--'}</span>
                </div>
                <div>
                  <b>NNDSS ID:</b> <span>{this.props.details.user_defined_id_nndss || '--'}</span>
                </div>
                <div>
                  <b>MONITOREE ID:</b> <span>{this.props.details.saa_student_id || '--'}</span>
                </div>
                <div>
                  <b>SUPERVISOR:</b> <span>{this.props.details.supervisor || '--'}</span>
                </div>
                <div>
                  <b>DEPARTMENT:</b> <span>{this.props.details.department || '--'}</span>
                </div>
                <div>
                  <b>PROJECT:</b> <span>{this.props.details.project || '--'}</span>
                </div>
              </Col>
              <Col sm={14} className="item-group">
                <div>
                  <b>Birth Sex:</b> <span>{this.props.details.sex || '--'}</span>
                </div>
                <div>
                  <b>Gender Identity:</b> <span>{this.props.details.gender_identity || '--'}</span>
                </div>
                <div>
                  <b>Sexual Orientation:</b> <span>{this.props.details.sexual_orientation || '--'}</span>
                </div>
                <div>
                  <b>Race:</b> {this.formatRace()}
                </div>
                <div>
                  <b>Ethnicity:</b> <span>{this.props.details.ethnicity || '--'}</span>
                </div>
                <div>
                  <b>Nationality:</b> <span>{this.props.details.nationality || '--'}</span>
                </div>
              </Col>
            </Row>
          </Col>
          <Col id="contact-information" lg={10} className="col-xxl-12">
            <div className="section-header">
              <h4 className="section-title">Contact Information</h4>
              <div className="edit-link">
                {this.props.goto && (
                  <Button
                    variant="link"
                    id="edit-contact_information-btn"
                    className="py-0"
                    onClick={() => this.props.goto(2)}
                    aria-label="Edit Contact Information">
                    Edit
                  </Button>
                )}
              </div>
            </div>
            <div className="item-group">
              <div>
                <b>Phone:</b> <span>{this.props.details.primary_telephone ? `${this.formatPhoneNumber(this.props.details.primary_telephone)}` : '--'}</span>
                {this.props.details.blocked_sms && (
                  <Form.Label className="tooltip-whitespace nav-input-label font-weight-bold">
                    &nbsp;SMS Blocked <InfoTooltip tooltipTextKey="blockedSMS" location="top"></InfoTooltip>
                  </Form.Label>
                )}
              </div>
              <div>
                <b>Preferred Contact Time:</b> <span>{this.props.details.preferred_contact_time || '--'}</span>
              </div>
              <div>
                <b>Primary Telephone Type:</b> <span>{this.props.details.primary_telephone_type || '--'}</span>
              </div>
              <div>
                <b>Email:</b> <span>{this.props.details.email || '--'}</span>
              </div>
              <div>
                <b>Preferred Reporting Method:</b>{' '}
                {(!this.props.details.blocked_sms || !this.props.details.preferred_contact_method?.includes('SMS')) && (
                  <span>{this.props.details.preferred_contact_method || '--'}</span>
                )}
                {this.props.details.blocked_sms && this.props.details.preferred_contact_method?.includes('SMS') && (
                  <span className="font-weight-bold text-danger">
                    {this.props.details.preferred_contact_method || '--'}
                    <Form.Label className="tooltip-whitespace">
                      <InfoTooltip tooltipTextKey="blockedSMSContactMethod" location="top"></InfoTooltip>
                    </Form.Label>
                  </span>
                )}
              </div>
            </div>
          </Col>
        </Row>
        {!this.props.editMode && (
          <div className="details-expander">
            <Button
              id="details-expander-link"
              variant="link"
              className="p-0"
              aria-label="Edit Notes"
              onClick={() => this.setState({ expanded: !this.state.expanded })}>
              <FontAwesomeIcon className={this.state.expanded ? 'chevron-opened' : 'chevron-closed'} icon={faChevronRight} />
              <span className="pl-2">{this.state.expanded ? 'Hide' : 'Show'} address, travel, exposure, and case information</span>
            </Button>
            <span className="dashed-line"></span>
          </div>
        )}
        <Collapse in={this.state.expanded}>
          <div>
            <Row>
              <Col id="address" lg={14} xl={12} className="col-xxxl-10">
                <div className="section-header">
                  <h4 className="section-title">Address</h4>
                  <div className="edit-link">
                    {this.props.goto && (
                      <Button variant="link" id="edit-address-btn" className="py-0" onClick={() => this.props.goto(1)} aria-label="Edit Address">
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <b>Building Name:</b> <span>{this.props.details.saa_building_name || '--'}</span>
                </div>
                <div>
                  <b>Floor Number:</b> <span>{this.props.details.saa_floor_number || '--'}</span>
                </div>
                <div>
                  <b>Room Number:</b> <span>{this.props.details.saa_room_number || '--'}</span>
                </div>
                {!(showDomesticAddress || showMonitoredAddress || showForeignAddress || showForeignMonitoringAddress) && <div className="none-text">None</div>}
                {(showDomesticAddress || showMonitoredAddress) && (
                  <Row>
                    {showDomesticAddress && (
                      <Col sm={showDomesticAddress && showMonitoredAddress ? 12 : 24} className="item-group">
                        <p className="subsection-title">Home Address (USA)</p>
                        <div>
                          <b>Address 1:</b> <span>{this.props.details.address_line_1 || '--'}</span>
                        </div>
                        <div>
                          <b>Address 2:</b> <span>{this.props.details.address_line_2 || '--'}</span>
                        </div>
                        <div>
                          <b>Town/City:</b> <span>{this.props.details.address_city || '--'}</span>
                        </div>
                        <div>
                          <b>State:</b> <span>{this.props.details.address_state || '--'}</span>
                        </div>
                        <div>
                          <b>Zip:</b> <span>{this.props.details.address_zip || '--'}</span>
                        </div>
                        <div>
                          <b>County:</b> <span>{this.props.details.address_county || '--'}</span>
                        </div>
                      </Col>
                    )}
                    {showMonitoredAddress && (
                      <Col sm={showDomesticAddress && showMonitoredAddress ? 12 : 24} className="item-group">
                        <p className="subsection-title">Monitoring Address</p>
                        <div>
                          <b>Address 1:</b> <span>{this.props.details.monitored_address_line_1 || '--'}</span>
                        </div>
                        <div>
                          <b>Address 2:</b> <span>{this.props.details.monitored_address_line_2 || '--'}</span>
                        </div>
                        <div>
                          <b>Town/City:</b> <span>{this.props.details.monitored_address_city || '--'}</span>
                        </div>
                        <div>
                          <b>State:</b> <span>{this.props.details.monitored_address_state || '--'}</span>
                        </div>
                        <div>
                          <b>Zip:</b> <span>{this.props.details.monitored_address_zip || '--'}</span>
                        </div>
                        <div>
                          <b>County:</b> <span>{this.props.details.monitored_address_county || '--'}</span>
                        </div>
                      </Col>
                    )}
                  </Row>
                )}
                {(showForeignAddress || showForeignMonitoringAddress) && (
                  <Row>
                    {showForeignAddress && (
                      <Col sm={showForeignAddress && showForeignMonitoringAddress ? 12 : 24} className="item-group">
                        <p className="subsection-title">Home Address (Foreign)</p>
                        <div>
                          <b>Address 1:</b> <span>{this.props.details.foreign_address_line_1 || '--'}</span>
                        </div>
                        <div>
                          <b>Address 2:</b> <span>{this.props.details.foreign_address_line_2 || '--'}</span>
                        </div>
                        <div>
                          <b>Address 3:</b> <span>{this.props.details.foreign_address_line_3 || '--'}</span>
                        </div>
                        <div>
                          <b>Town/City:</b> <span>{this.props.details.foreign_address_city || '--'}</span>
                        </div>
                        <div>
                          <b>State:</b> <span>{this.props.details.foreign_address_state || '--'}</span>
                        </div>
                        <div>
                          <b>Zip:</b> <span>{this.props.details.foreign_address_zip || '--'}</span>
                        </div>
                        <div>
                          <b>Country:</b> <span>{this.props.details.foreign_address_country || '--'}</span>
                        </div>
                      </Col>
                    )}
                    {showForeignMonitoringAddress && (
                      <Col sm={showForeignAddress && showForeignMonitoringAddress ? 12 : 24} className="item-group">
                        <p className="subsection-title">Monitoring Address</p>
                        <div>
                          <b>Address 1:</b> <span>{this.props.details.foreign_monitored_address_line_1 || '--'}</span>
                        </div>
                        <div>
                          <b>Address 2:</b> <span>{this.props.details.foreign_monitored_address_line_2 || '--'}</span>
                        </div>
                        <div>
                          <b>Town/City:</b> <span>{this.props.details.foreign_monitored_address_city || '--'}</span>
                        </div>
                        <div>
                          <b>State:</b> <span>{this.props.details.foreign_monitored_address_state || '--'}</span>
                        </div>
                        <div>
                          <b>Zip:</b> <span>{this.props.details.foreign_monitored_address_zip || '--'}</span>
                        </div>
                        <div>
                          <b>County:</b> <span>{this.props.details.foreign_monitored_address_county || '--'}</span>
                        </div>
                      </Col>
                    )}
                  </Row>
                )}
              </Col>
              <Col lg={10} xl={12} className="col-xxxl-14">
                <Row>
                  <Col id="arrival-information" xl={24} className="col-xxxl-12">
                    <div className="section-header">
                      <h4 className="section-title">Arrival Information</h4>
                      <div className="edit-link">
                        {this.props.goto && (
                          <Button
                            variant="link"
                            id="edit-arrival_information-btn"
                            className="py-0"
                            onClick={() => this.props.goto(3)}
                            aria-label="Edit Arrival Information">
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                    {!(showArrivalSection || this.props.details.travel_related_notes) && <div className="none-text">None</div>}
                    {showArrivalSection && (
                      <Row>
                        <Col md={12} lg={24} xl={12} className="item-group">
                          <p className="subsection-title">Departed</p>
                          <div>
                            <b>Port of Origin:</b> <span>{this.props.details.port_of_origin || '--'}</span>
                          </div>
                          <div>
                            <b>Date of Departure:</b>{' '}
                            <span>
                              {this.props.details.date_of_departure ? moment(this.props.details.date_of_departure, 'YYYY-MM-DD').format('MM/DD/YYYY') : '--'}
                            </span>
                          </div>
                        </Col>
                        <Col md={12} lg={24} xl={12} className="item-group">
                          <p className="subsection-title">Arrival</p>
                          <div>
                            <b>Port of Entry:</b> <span>{this.props.details.port_of_entry_into_usa || '--'}</span>
                          </div>
                          <div>
                            <b>Date of Arrival:</b>{' '}
                            <span>
                              {this.props.details.date_of_arrival ? moment(this.props.details.date_of_arrival, 'YYYY-MM-DD').format('MM/DD/YYYY') : '--'}
                            </span>
                          </div>
                        </Col>
                        <Col className="item-group">
                          <div>
                            <b>Carrier:</b> <span>{this.props.details.flight_or_vessel_carrier || '--'}</span>
                          </div>
                          <div>
                            <b>Flight or Vessel #:</b> <span>{this.props.details.flight_or_vessel_number || '--'}</span>
                          </div>
                        </Col>
                      </Row>
                    )}
                    {this.props.details.travel_related_notes && (
                      <div className="notes-section">
                        <p className="subsection-title">Notes</p>
                        {this.props.details.travel_related_notes.length < 400 && <div className="notes-text">{this.props.details.travel_related_notes}</div>}
                        {this.props.details.travel_related_notes.length >= 400 && (
                          <React.Fragment>
                            <div className="notes-text">
                              {this.state.expandArrivalNotes
                                ? this.props.details.travel_related_notes
                                : this.props.details.travel_related_notes.slice(0, 400) + ' ...'}
                            </div>
                            <Button
                              variant="link"
                              className="notes-button p-0"
                              onClick={() => this.setState({ expandArrivalNotes: !this.state.expandArrivalNotes })}>
                              {this.state.expandArrivalNotes ? '(Collapse)' : '(View all)'}
                            </Button>
                          </React.Fragment>
                        )}
                      </div>
                    )}
                  </Col>
                  <Col id="planned-travel" xl={24} className="col-xxxl-12">
                    <div className="section-header">
                      <h4 className="section-title">
                        <span className="d-none d-lg-inline d-xl-none d-xxl-inline">Additional</span> Planned Travel
                      </h4>
                      <div className="edit-link">
                        {this.props.goto && (
                          <Button
                            variant="link"
                            id="edit-planned_travel-btn"
                            className="py-0"
                            onClick={() => this.props.goto(4)}
                            aria-label="Edit Additional Planned Travel">
                            Edit
                          </Button>
                        )}
                      </div>
                    </div>
                    {!(showPlannedTravel || this.props.details.additional_planned_travel_related_notes) && <div className="none-text">None</div>}
                    {showPlannedTravel && (
                      <div className="item-group">
                        <div>
                          <b>Type:</b> <span>{this.props.details.additional_planned_travel_type || '--'}</span>
                        </div>
                        <div>
                          <b>Place:</b>{' '}
                          <span>
                            {this.props.details.additional_planned_travel_destination_country}
                            {this.props.details.additional_planned_travel_destination_state}
                            {!this.props.details.additional_planned_travel_destination_country &&
                              !this.props.details.additional_planned_travel_destination_state &&
                              '--'}
                          </span>
                        </div>
                        <div>
                          <b>Port of Departure:</b> <span>{this.props.details.additional_planned_travel_port_of_departure || '--'}</span>
                        </div>
                        <div>
                          <b>Start Date:</b>{' '}
                          <span>
                            {this.props.details.additional_planned_travel_start_date
                              ? moment(this.props.details.additional_planned_travel_start_date, 'YYYY-MM-DD').format('MM/DD/YYYY')
                              : '--'}
                          </span>
                        </div>
                        <div>
                          <b>End Date:</b>{' '}
                          <span>
                            {this.props.details.additional_planned_travel_end_date
                              ? moment(this.props.details.additional_planned_travel_end_date, 'YYYY-MM-DD').format('MM/DD/YYYY')
                              : '--'}
                          </span>
                        </div>
                      </div>
                    )}
                    {this.props.details.additional_planned_travel_related_notes && (
                      <div className="notes-section">
                        <p className="subsection-title">Notes</p>
                        {this.props.details.additional_planned_travel_related_notes.length < 400 && (
                          <div className="notes-text">{this.props.details.additional_planned_travel_related_notes}</div>
                        )}
                        {this.props.details.additional_planned_travel_related_notes.length >= 400 && (
                          <React.Fragment>
                            <div className="notes-text">
                              {this.state.expandPlannedTravelNotes
                                ? this.props.details.additional_planned_travel_related_notes
                                : this.props.details.additional_planned_travel_related_notes.slice(0, 400) + ' ...'}
                            </div>
                            <Button
                              variant="link"
                              className="notes-button p-0"
                              onClick={() => this.setState({ expandPlannedTravelNotes: !this.state.expandPlannedTravelNotes })}>
                              {this.state.expandPlannedTravelNotes ? '(Collapse)' : '(View all)'}
                            </Button>
                          </React.Fragment>
                        )}
                      </div>
                    )}
                  </Col>
                </Row>
              </Col>
            </Row>
            <Row>
              <Col id="potential-exposure-information" md={14} xl={12} className={this.props.details.isolation ? 'col-xxxl-8' : 'col-xxxl-10'}>
                <div className="section-header">
                  <h4 className="section-title">
                    Potential Exposure <span className="d-none d-lg-inline">Information</span>
                  </h4>
                  <div className="edit-link">
                    {this.props.goto && !this.props.details.isolation && (
                      <Button
                        variant="link"
                        id="edit-potential_exposure_information-btn"
                        className="py-0"
                        onClick={() => this.props.goto(5)}
                        aria-label="Edit Potential Exposure Information">
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
                {!(showPotentialExposureInfo || showRiskFactors || this.props.details.exposure_notes) && <div className="none-text">None</div>}
                {(showPotentialExposureInfo || showRiskFactors) && (
                  <React.Fragment>
                    <div className="item-group">
                      <div>
                        <b>Last Date of Exposure:</b>{' '}
                        <span>
                          {this.props.details.last_date_of_exposure
                            ? moment(this.props.details.last_date_of_exposure, 'YYYY-MM-DD').format('MM/DD/YYYY')
                            : '--'}
                        </span>
                      </div>
                      <div>
                        <b>Exposure Location:</b> <span>{this.props.details.potential_exposure_location || '--'}</span>
                      </div>
                      <div>
                        <b>Exposure Country:</b> <span>{this.props.details.potential_exposure_country || '--'}</span>
                      </div>
                    </div>
                    <div className="item-group">
                      <div>
                        <b>Last Day at Work:</b>{' '}
                        <span>
                          {this.props.details.saa_last_day_at_work ? moment(this.props.details.saa_last_day_at_work, 'YYYY-MM-DD').format('MM/DD/YYYY') : '--'}
                        </span>
                      </div>
                      {this.props.details.saa_last_day_at_work && (
                        <div>
                          <b>Has Overlap:</b>
                          <span>{HasOverlap(this.props.details) ? 'Yes' : 'No'}</span>
                        </div>
                      )}
                    </div>
                    <div className="item-group">
                      <div>
                        <b>Risk Factors</b>
                      </div>
                    </div>
                    {!showRiskFactors && <span className="none-text">None</span>}
                    {showRiskFactors && (
                      <ul className="risk-factors">
                        {this.props.details.contact_of_known_case && (
                          <li>
                            <span className="risk-factor">Close Contact with a Known Case</span>
                            {this.props.details.contact_of_known_case_id && <span className="risk-val">{this.props.details.contact_of_known_case_id}</span>}
                          </li>
                        )}
                        {this.props.details.member_of_a_common_exposure_cohort && (
                          <li>
                            <span className="risk-factor">Member of a Common Exposure Cohort</span>
                            {this.props.details.member_of_a_common_exposure_cohort_type && (
                              <span className="risk-val">{this.props.details.member_of_a_common_exposure_cohort_type}</span>
                            )}
                          </li>
                        )}
                        {this.props.details.travel_to_affected_country_or_area && (
                          <li>
                            <span className="risk-factor">Travel from Affected Country or Area</span>
                          </li>
                        )}
                        {this.props.details.was_in_health_care_facility_with_known_cases && (
                          <li>
                            <span className="risk-factor">Was in Healthcare Facility with Known Cases</span>
                            {this.props.details.was_in_health_care_facility_with_known_cases_facility_name && (
                              <span className="risk-val">{this.props.details.was_in_health_care_facility_with_known_cases_facility_name}</span>
                            )}
                          </li>
                        )}
                        {this.props.details.laboratory_personnel && (
                          <li>
                            <span className="risk-factor">Laboratory Personnel</span>
                            {this.props.details.laboratory_personnel_facility_name && (
                              <span className="risk-val">{this.props.details.laboratory_personnel_facility_name}</span>
                            )}
                          </li>
                        )}
                        {this.props.details.healthcare_personnel && (
                          <li>
                            <span className="risk-factor">Healthcare Personnel</span>
                            {this.props.details.healthcare_personnel_facility_name && (
                              <span className="risk-val">{this.props.details.healthcare_personnel_facility_name}</span>
                            )}
                          </li>
                        )}
                        {this.props.details.crew_on_passenger_or_cargo_flight && (
                          <li>
                            <span className="risk-factor">Crew on Passenger or Cargo Flight</span>
                          </li>
                        )}
                      </ul>
                    )}
                  </React.Fragment>
                )}
                {this.props.details.exposure_notes && !showPotentialExposureInfo && !showRiskFactors && (
                  <div className="notes-section">
                    <p className="subsection-title">Notes</p>
                    {this.props.details.exposure_notes.length < 400 && <div className="notes-text">{this.props.details.exposure_notes}</div>}
                    {this.props.details.exposure_notes.length >= 400 && (
                      <React.Fragment>
                        <div className="notes-text">
                          {this.state.expandNotes ? this.props.details.exposure_notes : this.props.details.exposure_notes.slice(0, 400) + ' ...'}
                        </div>
                        <Button variant="link" className="notes-button p-0" onClick={() => this.setState({ expandNotes: !this.state.expandNotes })}>
                          {this.state.expandNotes ? '(Collapse)' : '(View all)'}
                        </Button>
                      </React.Fragment>
                    )}
                  </div>
                )}
              </Col>
              {this.props.details.isolation && (
                <Col id="case-information" md={10} xl={12} className="col-xxxl-8">
                  <div className="section-header">
                    <h4 className="section-title">Case Information</h4>
                    <div className="edit-link">
                      {this.props.goto && (
                        <Button
                          variant="link"
                          id="edit-potential_exposure_information-btn"
                          className="py-0"
                          onClick={() => this.props.goto(5)}
                          aria-label="Edit Case Information">
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="item-group">
                    <div>
                      <b>Symptom Onset:</b>{' '}
                      <span>{this.props.details.symptom_onset ? moment(this.props.details.symptom_onset, 'YYYY-MM-DD').format('MM/DD/YYYY') : '--'}</span>
                    </div>
                    <div>
                      <b>Case Status:</b> <span>{this.props.details.case_status || '--'}</span>
                    </div>
                  </div>
                </Col>
              )}
              {(showPotentialExposureInfo || showRiskFactors) && (
                <Col id="exposure-notes" md={10} xl={12} className="notes-section col-xxxl-8">
                  <div className="section-header">
                    <h4 className="section-title">Notes</h4>
                    <div className="edit-link">
                      {this.props.goto && (
                        <Button variant="link" id="edit-notes-btn" className="py-0" onClick={() => this.props.goto(5)} aria-label="Edit Notes">
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                  {!this.props.details.exposure_notes && <div className="none-text">None</div>}
                  {this.props.details.exposure_notes && this.props.details.exposure_notes.length < 400 && (
                    <div className="notes-text">{this.props.details.exposure_notes}</div>
                  )}
                  {this.props.details.exposure_notes && this.props.details.exposure_notes.length >= 400 && (
                    <React.Fragment>
                      <div className="notes-text">
                        {this.state.expandNotes ? this.props.details.exposure_notes : this.props.details.exposure_notes.slice(0, 400) + ' ...'}
                      </div>
                      <Button variant="link" className="notes-button p-0" onClick={() => this.setState({ expandNotes: !this.state.expandNotes })}>
                        {this.state.expandNotes ? '(Collapse)' : '(View all)'}
                      </Button>
                    </React.Fragment>
                  )}
                </Col>
              )}
            </Row>
          </div>
        </Collapse>
        {this.props?.details?.responder_id && this.props.details.responder_id != this.props.details.id && (
          <div id="household-member-not-hoh" className="household-info">
            <Row>
              The reporting responsibility for this monitoree is handled by another monitoree.&nbsp;
              <a href={'/patients/' + this.props.details.responder_id}>Click here to view that monitoree</a>.
            </Row>
            <Row>
              <RemoveFromHousehold patient={this.props?.details} dependents={this.props?.dependents} authenticity_token={this.props.authenticity_token} />
            </Row>
          </div>
        )}
        {this.props?.dependents && this.props?.dependents?.length > 0 && (
          <Row id="head-of-household" className="household-info">
            <Col>
              <Row>This monitoree is responsible for handling the reporting of the following other monitorees:</Row>
              <Row className="pt-2">
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Workflow</th>
                      <th>Monitoring Status</th>
                      <th>Continuous Exposure?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.props?.dependents?.map((member, index) => {
                      return (
                        <tr key={`dl-${index}`}>
                          <td>
                            <a href={'/patients/' + member.id}>
                              {member.last_name}, {member.first_name} {member.middle_name || ''}
                            </a>
                          </td>
                          <td>{member.isolation ? 'Isolation' : 'Exposure'}</td>
                          <td>{member.monitoring ? 'Actively Monitoring' : 'Not Monitoring'}</td>
                          <td>{member.continuous_exposure ? 'Yes' : 'No'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              </Row>
              <Row>
                <ChangeHOH patient={this.props?.details} dependents={this.props?.dependents} authenticity_token={this.props.authenticity_token} />
              </Row>
            </Col>
          </Row>
        )}
        {this.props?.dependents &&
          this.props?.dependents?.length == 0 &&
          this.props?.details?.responder_id &&
          this.props.details.responder_id == this.props.details.id && (
            <Row id="no-household" className="household-info">
              <Col>
                <Row>This monitoree is not a member of a household:</Row>
                {this.props?.dependents?.map((member, index) => {
                  return (
                    <Row key={'gm' + index}>
                      <a href={'/patients/' + member.id}>
                        {member.last_name}, {member.first_name} {member.middle_name || ''}
                      </a>
                    </Row>
                  );
                })}
                <Row>
                  <MoveToHousehold patient={this.props?.details} authenticity_token={this.props.authenticity_token} />
                </Row>
              </Col>
            </Row>
          )}
        {!this.props.editMode && (
          <Row style={{ padding: '5px 15px 0px' }}>
            <Col>
              <Row>Notifications:</Row>
              <Row>
                <Button className="my-2 btn-sm" variant="primary btn-square" onClick={() => this.openNotificationsModal()} aria-label="Edit Case Information">
                  Send Notifications
                </Button>
              </Row>
            </Col>
          </Row>
        )}
        {this.props.details && this.props.details.id && (
          <NotificationsModal
            patientId={this.props.details.id}
            onClose={this.closeNotificationsModal}
            show={this.state.showNotificationsModal}
            authenticity_token={this.props.authenticity_token}></NotificationsModal>
        )}
        <ToastContainer position="top-center" autoClose={2000} closeOnClick pauseOnVisibilityChange draggable pauseOnHover />
      </React.Fragment>
    );
  }
}

Patient.propTypes = {
  dependents: PropTypes.array,
  details: PropTypes.object,
  jurisdiction_path: PropTypes.string,
  goto: PropTypes.func,
  editMode: PropTypes.bool,
  hideBody: PropTypes.bool,
  authenticity_token: PropTypes.string,
};

export default Patient;
