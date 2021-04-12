import React from 'react';
import { PropTypes } from 'prop-types';
import { Form, Row, Col, Button, Modal } from 'react-bootstrap';
import axios from 'axios';
import moment from 'moment';

import DateInput from '../util/DateInput';
import reportError from '../util/ReportError';

class Vaccine extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showModal: false,
      loading: false,
      vaccinated: this.props.vac.vaccinated || false,
      first_vac_date: this.props.vac.first_vac_date,
      second_vac_date: this.props.vac.second_vac_date,
      disease: this.props.vac.disease || '',
      disease_select: this.props.vac.disease || '',
      vac_type: this.props.vac.vac_type || '',
      vac_type_select: this.props.vac.vac_type || '',
      lot_number: this.props.vac.lot_number || '',
      lot_number_select: this.props.vac.lot_number || '',
      showDiseaseField: false,
      showVacTypeField: false,
      showLotNumberField: false,
      disease_options: [],
      vac_type_options: [],
      lot_number_options: [],
      firstDateInvalid: false,
      secondDateInvalid: false,
      onLoadValid: true,
    };
    this.toggleModal = this.toggleModal.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleDiseaseChange = this.handleDiseaseChange.bind(this);
    this.handleVacTypeChange = this.handleVacTypeChange.bind(this);
    this.handleLotNumberChange = this.handleLotNumberChange.bind(this);
    this.submit = this.submit.bind(this);
  }

  toggleModal() {
    this.setState(state => {
      return {
        showModal: !state.showModal,
        loading: false,
        vaccinated: this.props.vac.vaccinated || false,
        first_vac_date: this.props.vac.first_vac_date,
        second_vac_date: this.props.vac.second_vac_date,
        disease: this.props.vac.disease || '',
        disease_select: this.props.vac.disease || '',
        vac_type: this.props.vac.vac_type || '',
        vac_type_select: this.props.vac.vac_type || '',
        lot_number: this.props.vac.lot_number || '',
        lot_number_select: this.props.vac.lot_number || '',
        showDiseaseField: false,
        showVacTypeField: false,
        showLotNumberField: false,
        firstDateInvalid: false,
        secondDateInvalid: false,
        onLoadValid: this.props.onLoadValid || false,
      };
    });
  }

  componentDidMount() {
    this.getVaccineSelectData();
  }

  /** Handles data for selects in vaccine modal */
  getVaccineSelectData() {
    const params = { id: this.props.patient.id };
    axios.defaults.headers.common['X-CSRF-Token'] = this.props.authenticity_token;
    axios
      .get('/vaccines/get_modal_data', {
        params: params,
      })
      .then(response => {
        if (response && response.data) {
          this.setState({
            disease_options: response.data.diseases,
            vac_type_options: response.data.vaccine_types,
            lot_number_options: response.data.lot_numbers,
          });
        }
      })
      .catch(error => {
        reportError(error);
      });
  }

  /** Handles changes for fields in vaccine modal */
  handleChange(event) {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    this.setState({ [event.target.id]: value });
  }

  /** Handles changes to the date fields */
  handleDateChange(field, date) {
    this.setState({ [field]: date }, () => {
      this.setState(state => {
        return {
          vaccinated: state.first_vac_date && state.second_vac_date ? true : state.vaccinated,
          firstDateInvalid: state.first_vac_date ? false : true,
          secondDateInvalid: moment(state.second_vac_date).isBefore(state.first_vac_date, 'day'),
          onLoadValid: true,
        };
      });
    });
  }

  /** Handles changes to the disease select and text field */
  handleDiseaseChange(event) {
    const value = event.target.value;
    if (value == '+ Add New Disease') {
      this.setState({
        showDiseaseField: true,
        disease: '',
        disease_select: '+ Add New Disease',
      });
    } else if (value == '--Select Disease--') {
      this.setState({
        showDiseaseField: false,
        disease: '',
        disease_select: '--Select Disease--',
      });
    } else {
      this.setState({
        showDiseaseField: false,
        disease: event.target.value,
        disease_select: event.target.value,
      });
    }
  }

  /** Handles changes to the vaccine type select and text field */
  handleVacTypeChange(event) {
    const value = event.target.value;
    if (value == '+ Add New Vaccine Type') {
      this.setState({
        showVacTypeField: true,
        vac_type: '',
        vac_type_select: '+ Add New Vaccine Type',
      });
    } else if (value == '--Select Vaccine Type--') {
      this.setState({
        showVacTypeField: false,
        vac_type: '',
        vac_type_select: '--Select Vaccine Type--',
      });
    } else {
      this.setState({
        showVacTypeField: false,
        vac_type: event.target.value,
        vac_type_select: event.target.value,
      });
    }
  }

  /** Handles changes to the lot number select and text fields */
  handleLotNumberChange(event) {
    const value = event.target.value;
    if (value == '+ Add New Lot Number') {
      this.setState({
        showLotNumberField: true,
        lot_number: '',
        lot_number_select: '+ Add New Lot Number',
      });
    } else if (value == '--Select Lot Number--') {
      this.setState({
        showLotNumberField: false,
        lot_number: '',
        lot_number_select: '--Select Lot Number--',
      });
    } else {
      this.setState({
        showLotNumberField: false,
        lot_number: event.target.value,
        lot_number_select: event.target.value,
      });
    }
  }

  /** Submits the form data for the vaccine modal */
  submit() {
    this.setState({ loading: true }, () => {
      axios.defaults.headers.common['X-CSRF-Token'] = this.props.authenticity_token;
      axios
        .post(window.BASE_PATH + '/vaccines' + (this.props.vac.id ? '/' + this.props.vac.id : ' '), {
          patient_id: this.props.patient.id,
          vaccinated: this.state.vaccinated,
          first_vac_date: this.state.first_vac_date,
          second_vac_date: this.state.second_vac_date,
          disease: this.state.disease,
          vac_type: this.state.vac_type,
          lot_number: this.state.lot_number,
        })
        .then(() => {
          location.reload(true);
        })
        .catch(error => {
          reportError(error);
        });
    });
  }

  /** Creates the vaccine modal */
  createModal(title, toggle, submit) {
    return (
      <Modal size="lg" show centered onHide={toggle}>
        <Modal.Header>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Form.Group as={Col}>
                <Form.Label className="nav-input-label">First Vaccination Date</Form.Label>
                <DateInput
                  id="first_vac_date"
                  date={this.state.first_vac_date}
                  minDate={'2020-01-01'}
                  maxDate={moment().format('YYYY-MM-DD')}
                  onChange={date => this.handleDateChange('first_vac_date', date)}
                  placement="bottom"
                  customClass="form-control-lg"
                />
                <Form.Control.Feedback className="d-block" type="invalid">
                  {this.state.firstDateInvalid && <span>First Vaccination Date can not be empty.</span>}
                </Form.Control.Feedback>
              </Form.Group>
            </Row>
            <Row>
              <Form.Group as={Col}>
                <Form.Label className="nav-input-label">Second Vaccination Date</Form.Label>
                <DateInput
                  id="second_vac_date"
                  date={this.state.second_vac_date}
                  minDate={'2020-01-01'}
                  maxDate={moment().format('YYYY-MM-DD')}
                  onChange={date => this.handleDateChange('second_vac_date', date)}
                  placement="bottom"
                  isValid={this.state.vaccinationInvalid}
                  customClass="form-control-lg"
                />
                <Form.Control.Feedback className="d-block" type="invalid">
                  {this.state.secondDateInvalid && <span>Second vaccination date cannot be before first.</span>}
                </Form.Control.Feedback>
              </Form.Group>
            </Row>
            <Row>
              <Form.Group as={Col}>
                <Form.Label className="nav-input-label">Disease</Form.Label>
                <Form.Control as="select" size="md" id="disease_select" value={this.state.disease_select} onChange={this.handleDiseaseChange}>
                  <option>--Select Disease--</option>
                  {this.state.disease_options.map((x, y) => (
                    <option key={y}>{x}</option>
                  ))}
                  <option>+ Add New Disease</option>
                </Form.Control>
                {this.state.showDiseaseField && (
                  <Form.Control size="lg" id="disease" className="form-square mt-3" value={this.state.disease} onChange={this.handleChange} />
                )}
              </Form.Group>
            </Row>
            <Row>
              <Form.Group as={Col}>
                <Form.Label className="nav-input-label">Type</Form.Label>
                <Form.Control as="select" size="md" id="vac_type_select" value={this.state.vac_type_select} onChange={this.handleVacTypeChange}>
                  <option>--Select Vaccine Type--</option>
                  {this.state.vac_type_options.map((x, y) => (
                    <option key={y}>{x}</option>
                  ))}
                  <option>+ Add New Vaccine Type</option>
                </Form.Control>
                {this.state.showVacTypeField && (
                  <Form.Control
                    size="lg"
                    id="vac_type"
                    className="form-square mt-3" //d-none
                    value={this.state.vac_type || ''}
                    onChange={this.handleChange}
                  />
                )}
              </Form.Group>
            </Row>
            <Row>
              <Form.Group as={Col}>
                <Form.Label className="nav-input-label">Lot Number</Form.Label>
                <Form.Control as="select" size="md" id="lot_number_select" value={this.state.lot_number_select} onChange={this.handleLotNumberChange}>
                  <option>--Select Lot Number--</option>
                  {this.state.lot_number_options.map((x, y) => (
                    <option key={y}>{x}</option>
                  ))}
                  <option>+ Add New Lot Number</option>
                </Form.Control>
                {this.state.showLotNumberField && (
                  <Form.Control
                    size="lg"
                    id="lot_number"
                    className="form-square mt-3" // d-none
                    value={this.state.lot_number || ''}
                    onChange={this.handleChange}
                  />
                )}
              </Form.Group>
            </Row>
            <Row>
              <Form.Group as={Col}>
                <Form.Check
                  id="vaccinated"
                  size="lg"
                  name="vaccinated"
                  type="checkbox"
                  checked={this.state.vaccinated}
                  className="pb-2"
                  label="Vaccinated"
                  onChange={this.handleChange}
                />
              </Form.Group>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary btn-square" onClick={toggle}>
            Cancel
          </Button>
          <Button
            variant="primary btn-square"
            disabled={this.state.loading || !this.state.onLoadValid || this.state.firstDateInvalid || this.state.secondDateInvalid}
            onClick={submit}>
            Create
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }

  render() {
    return (
      <React.Fragment>
        {!this.props.vac.id && (
          <Button onClick={this.toggleModal}>
            <i className="fas fa-plus"></i> Add New Vaccine
          </Button>
        )}
        {this.props.vac.id && (
          <Button variant="link" onClick={this.toggleModal} className="btn btn-link py-0" size="sm">
            <i className="fas fa-edit"></i> Edit
          </Button>
        )}
        {this.state.showModal && this.createModal('Vaccine', this.toggleModal, this.submit)}
      </React.Fragment>
    );
  }
}

Vaccine.propTypes = {
  vac: PropTypes.object,
  patient: PropTypes.object,
  authenticity_token: PropTypes.string,
  onLoadValid: PropTypes.bool,
};

export default Vaccine;
