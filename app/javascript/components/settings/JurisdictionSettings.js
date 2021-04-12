import React from 'react';

import {
  Card,
  Table,
  Button,
  /* OverlayTrigger, Tooltip, */
  Form,
} from 'react-bootstrap';
import PropTypes from 'prop-types';

import axios from 'axios';
import reportError from '../util/ReportError';

import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';

class JurisdictionSettings extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      jurisdiction_root: this.props.jurisdiction_root,
      showModal: false,
      message: {},
      newJurisdictionName: '',
      newSubJurisdictionName: '',
      openSubJurisdiction: null,
      openEditJurisdiction: null,
      editJurisdictionName: '',
    };
  }

  handleJurisdictionChange = event => {
    const value = event.target.value;
    this.setState({ newJurisdictionName: value });
  };

  handleSubJurisdictionChange = event => {
    const value = event.target.value;
    this.setState({ newSubJurisdictionName: value });
  };

  handleEditJurisdictionChange = event => {
    const value = event.target.value;
    this.setState({ editJurisdictionName: value });
  };

  toastSuccess = phrase => {
    toast.success(`"${phrase}"`, {
      position: toast.POSITION.TOP_CENTER,
    });
  };

  toastError = errorMessage => {
    toast.error(errorMessage, {
      autoClose: 2000,
      position: toast.POSITION.TOP_CENTER,
    });
  };

  saveJurisdiction = (newJurisdiction, parentJurisdiction) => {
    axios.defaults.headers.common['X-CSRF-Token'] = this.props.authenticity_token;
    const url = window.BASE_PATH + '/settings/jurisdictions';
    return axios
      .post(url, newJurisdiction)
      .then(response => {
        const savedJurisdiction = response.data.jurisdiction;
        parentJurisdiction.children.push(savedJurisdiction);
        this.toastSuccess(`Added '${savedJurisdiction.name}' successfully!`);
        if (this.state.openSubJurisdiction) {
          const openSubJurisdiction = this.state.openSubJurisdiction;
          openSubJurisdiction.showAddChild = false;
        }
        this.setState({
          jurisdiction_root: this.state.jurisdiction_root,
          newJurisdictionName: '',
          newSubJurisdictionName: '',
          openSubJurisdiction: null,
        });
      })
      .catch(err => {
        reportError(err);
      });
  };

  deleteJurisdiction = (removedJurisdiction, parentJurisdiction) => {
    axios.defaults.headers.common['X-CSRF-Token'] = this.props.authenticity_token;
    const url = window.BASE_PATH + '/settings/jurisdictions/delete';
    return axios
      .post(url, removedJurisdiction)
      .then(() => {
        const index = parentJurisdiction.children.indexOf(removedJurisdiction);
        if (index > -1) {
          parentJurisdiction.children.splice(index, 1);
          this.toastSuccess(`Removed '${removedJurisdiction.name}' successfully!`);
          this.setState({
            jurisdiction_root: this.state.jurisdiction_root,
          });
        }
      })
      .catch(err => {
        reportError(err);
      });
  };

  updateJurisdiction = (jur, updatedJur, parentJur) => {
    axios.defaults.headers.common['X-CSRF-Token'] = this.props.authenticity_token;
    const url = window.BASE_PATH + '/settings/jurisdictions/update';
    return axios
      .post(url, updatedJur)
      .then(response => {
        const updatedJurisdiction = response.data.jurisdiction;
        this.toastSuccess(`Updated '${updatedJur.name}' successfully!`);
        if (this.state.openEditJurisdiction) {
          const openEditJurisdiction = this.state.openEditJurisdiction;
          openEditJurisdiction.showEdit = false;
        }
        const index = parentJur.children.indexOf(jur);
        if (index > -1) {
          parentJur.children[index] = updatedJurisdiction;
        }
        this.setState({
          jurisdiction_root: this.state.jurisdiction_root,
          openEditJurisdiction: null,
          editJurisdictionName: '',
        });
      })
      .catch(err => {
        reportError(err);
      });
  };

  addJurisdiction = (jurisdictionName, parentJurisdiction) => {
    if (!jurisdictionName || !jurisdictionName.trim()) {
      return;
    }
    const newName = jurisdictionName.trim();
    if (parentJurisdiction.children.some(p => p.name.toLowerCase() === newName.toLowerCase())) {
      this.toastError(`'${parentJurisdiction.name}' already has a subjurisdiction named '${newName}'`);
    } else {
      const newJurisdiction = {
        parent_id: parentJurisdiction.id,
        name: newName,
      };
      this.saveJurisdiction(newJurisdiction, parentJurisdiction);
    }
  };

  removeJurisdiction = (jurisdiction, parentJurisdiction) => {
    this.deleteJurisdiction(jurisdiction, parentJurisdiction);
  };

  editJurisdiction = (newJurName, jur, parentJur) => {
    if (!newJurName || !newJurName.trim()) {
      return;
    }
    const newName = newJurName.trim();
    if (parentJur.children.some(p => p.name.toLowerCase() === newName.toLowerCase())) {
      this.toastError(`'${parentJur.name}' already has a subjurisdiction named '${newName}'`);
    } else {
      const updatedJur = {
        id: jur.id,
        name: newName,
      };
      this.updateJurisdiction(jur, updatedJur, parentJur);
    }
  };

  toggleShowAddChild = jurisdiction => {
    jurisdiction.showAddChild = !jurisdiction.showAddChild;
    if (this.state.openSubJurisdiction && this.state.openSubJurisdiction.showAddChild) {
      const openSubJurisdiction = this.state.openSubJurisdiction;
      openSubJurisdiction.showAddChild = false;
    }
    this.setState({
      jurisdiction_root: this.state.jurisdiction_root,
      openSubJurisdiction: jurisdiction.showAddChild ? jurisdiction : null,
      newSubJurisdictionName: '',
    });
  };

  toggleEdit = jurisdiction => {
    jurisdiction.showEdit = !jurisdiction.showEdit;
    if (this.state.openEditJurisdiction && this.state.openEditJurisdiction.showEdit) {
      const openEditJurisdiction = this.state.openEditJurisdiction;
      openEditJurisdiction.showEdit = false;
    }
    this.setState({
      jurisdiction_root: this.state.jurisdiction_root,
      openEditJurisdiction: jurisdiction.showEdit ? jurisdiction : null,
      editJurisdictionName: jurisdiction.name,
    });
  };

  cancelEdit = child => {
    child.showEdit = !child.showEdit;
    this.setState({
      openEditJurisdiction: null,
      editJurisdictionName: '',
    });
  };

  renderChildRows = (jurisdiction, depth) => {
    const icon = [];
    const child_icon = [];
    for (let i = 1; i <= depth; i++) {
      icon.push(<i key={`ico-${depth}-${i}`} className="fas fa-chevron-right"></i>);
    }
    for (let i = 0; i <= depth; i++) {
      child_icon.push(<i key={`c-ico-${depth}-${i}`} className="fas fa-chevron-right"></i>);
    }
    return jurisdiction.children.map((child, i) => {
      return (
        <React.Fragment key={i}>
          <tr>
            <td>
              {!child.showEdit && (
                <div>
                  {icon}
                  {child.name}
                </div>
              )}
              {child.showEdit && (
                <Form inline>
                  <Form.Label>{icon} </Form.Label>
                  <Form.Control
                    aria-label="add subjurisdiction"
                    placeholder="Jurisdiction name"
                    value={this.state.editJurisdictionName}
                    onChange={this.handleEditJurisdictionChange}
                  />
                </Form>
              )}
            </td>
            <td style={{ textAlign: 'right' }}>{child.patient_count}</td>
            <td>
              {!child.showEdit && this.renderActions(child, jurisdiction)}
              {child.showEdit && (
                <div>
                  <Button
                    variant="primary btn-square"
                    onClick={() => {
                      this.editJurisdiction(this.state.editJurisdictionName, child, jurisdiction);
                    }}>
                    Save Edit
                  </Button>
                  <Button
                    variant="primary btn-square"
                    className="ml-1"
                    onClick={() => {
                      this.cancelEdit(child);
                    }}>
                    X
                  </Button>
                </div>
              )}
            </td>
          </tr>
          {child.showAddChild && (
            <tr>
              <td>
                <Form inline>
                  <Form.Label>{child_icon} </Form.Label>
                  <Form.Control
                    aria-label="add subjurisdiction"
                    placeholder="Jurisdiction name"
                    value={this.state.newSubJurisdictionName}
                    onChange={this.handleSubJurisdictionChange}
                  />
                </Form>
              </td>
              <td></td>
              <td>
                <Button
                  variant="primary btn-square"
                  onClick={() => {
                    this.addJurisdiction(this.state.newSubJurisdictionName, child);
                  }}>
                  Save New
                </Button>
              </td>
            </tr>
          )}
          {this.renderChildRows(child, depth + 1)}
        </React.Fragment>
      );
    });
  };

  renderActions = (child, jurisdiction) => {
    return (
      <React.Fragment>
        <Button
          variant="primary btn-square"
          onClick={() => {
            this.toggleShowAddChild(child);
          }}>
          {child.showAddChild ? 'Hide' : 'Add'}
        </Button>
        {child.patient_count === 0 && !child.showAddChild && (
          <Button
            variant="primary btn-square"
            className="ml-1"
            onClick={() => {
              this.toggleEdit(child);
            }}>
            Edit
          </Button>
        )}
        {child.patient_count === 0 && !child.showAddChild && (
          <Button
            variant="primary btn-square"
            className="ml-1"
            onClick={() => {
              this.removeJurisdiction(child, jurisdiction);
            }}>
            Remove
          </Button>
        )}
      </React.Fragment>
    );
  };

  getJurisdictionTable = () => {
    return (
      <Table className="saa-spaced-table-icons" striped bordered hover>
        <thead>
          <tr>
            <th>Jurisdiction</th>
            <th style={{ width: '140px', textAlign: 'right' }}>Monitorees</th>
            <th style={{ width: '240px', textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>{this.renderChildRows(this.state.jurisdiction_root, 0)}</tbody>
      </Table>
    );
  };

  render() {
    return (
      <React.Fragment>
        <Card className="card-square">
          <Card.Header as="h5">Jurisdictions for {this.state.jurisdiction_root.name}</Card.Header>
          <Card.Body>
            <Form>
              <Table>
                <tbody>
                  <tr>
                    <td>
                      <Form.Control
                        aria-label="add jurisdiction"
                        placeholder="Jurisdiction name"
                        value={this.state.newJurisdictionName}
                        onChange={this.handleJurisdictionChange}
                      />
                    </td>
                    <td style={{ width: '200px' }}>
                      <Button
                        style={{ lineHeight: '1.5em' }}
                        variant="primary btn-square"
                        onClick={() => {
                          this.addJurisdiction(this.state.newJurisdictionName, this.state.jurisdiction_root);
                        }}>
                        {' '}
                        Add Jurisdiction{' '}
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Form>
            {this.getJurisdictionTable()}
          </Card.Body>
        </Card>
        <div>&nbsp;</div>
        <ToastContainer position="top-center" autoClose={2000} closeOnClick pauseOnVisibilityChange draggable pauseOnHover />
      </React.Fragment>
    );
  }
}

JurisdictionSettings.propTypes = {
  authenticity_token: PropTypes.string,
  jurisdiction_root: PropTypes.object,
};

export default JurisdictionSettings;
