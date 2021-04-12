import React from 'react';
import { PropTypes } from 'prop-types';
import { Badge, Button, Card, Col, Form, InputGroup, Nav, OverlayTrigger, TabContent, Tooltip, Row } from 'react-bootstrap';

import axios from 'axios';
import moment from 'moment-timezone';
import _ from 'lodash';

import InfoTooltip from '../util/InfoTooltip';
import CustomTable from '../layout/CustomTable';

class PatientsTable extends React.Component {
  constructor(props) {
    super(props);
    this.handleTabSelect = this.handleTabSelect.bind(this);
    this.state = {
      table: {
        colData: [
          { label: 'Id', field: 'id', isSortable: true },
          { label: 'Name', field: 'name', isSortable: true },
          { label: 'Email', field: 'email', isSortable: true },
          { label: 'Jurisdiction', field: 'jurisdiction', isSortable: true },
          { label: 'Exposed', field: 'exposed', isSortable: false, options: { true: 'Yes', false: 'No' } },
          { label: 'Tested Positive', field: 'tested_positive', isSortable: false, options: { true: 'Yes', false: 'No' } },
          { label: 'Symptoms', field: 'concerning_symptoms', isSortable: false, options: { true: 'Yes', false: 'No' } },
        ],
        displayedColData: [],
        rowData: [],
        totalRows: 0,
      },
      loading: false,
      actionsEnabled: false,
      canEdit: false,
      selectedPatients: [],
      selectAll: false,
      jurisdiction_paths: {},
      assigned_users: [],
      form: {
        jurisdiction_path: props.jurisdiction.path,
        assigned_user: '',
      },
      query: {
        tab: Object.keys(props.tabs)[0],
        jurisdiction: props.jurisdiction.id,
        scope: 'all',
        user: 'all',
        search: '',
        page: 0,
        entries: 25,
      },
      entryOptions: [10, 15, 25, 50, 100],
      cancelToken: axios.CancelToken.source(),
      filter: null,
    };
    this.state.jurisdiction_paths[props.jurisdiction.id] = props.jurisdiction.path;
  }

  componentDidMount() {
    // load saved tab from local storage if present
    let tab = localStorage.getItem(`${this.props.workflow}Tab`);
    if (tab === null || !(tab in this.props.tabs)) {
      tab = this.state.query.tab;
      localStorage.setItem(`${this.props.workflow}Tab`, tab);
    }

    // select tab and fetch patients
    this.handleTabSelect(tab);

    // Select page if it exists in local storage
    let page = localStorage.getItem(`${window.USER_ID}SaraPage`);
    if (page) {
      this.handlePageUpdate(JSON.parse(page));
    }

    // Set entries if it exists in local storage
    let entries = localStorage.getItem(`${window.USER_ID}SaraEntries`);
    if (parseInt(entries)) {
      this.handleEntriesChange(parseInt(entries));
    }

    // Set search if it exists in local storage
    let search = localStorage.getItem(`${window.USER_ID}SaraSearch`);
    if (search) {
      this.setState(
        state => {
          return {
            query: { ...state.query, search: search },
          };
        },
        () => {
          this.updateTable(this.state.query);
        }
      );
    }

    // set token
    axios.defaults.headers.common['X-CSRF-Token'] = this.props.authenticity_token;

    // fetch workflow and tab counts
    Object.keys(this.props.tabs).forEach(tab => {
      axios.get(`/public_health/patients/counts/${this.props.workflow}/${tab}`).then(response => {
        const count = {};
        count[`${tab}Count`] = response.data.total;
        this.setState(count);
      });
    });

    // fetch list of jurisdiction paths
    this.updateJurisdictionPaths();
  }

  // Handle when a tab is selected
  handleTabSelect = tab => {
    localStorage.removeItem(`${window.USER_ID}SaraPage`);
    this.setState(
      state => {
        return { query: { ...state.query, tab, page: 0 } };
      },
      () => {
        this.updateTable(this.state.query);
        localStorage.setItem(`${window.USER_ID}${this.props.workflow}Tab`, tab);
      }
    );
  };

  /**
   * Called when a page is clicked in the pagination component.
   * Updates the table based on the selected page.
   *
   * @param {Object} page - Page object from react-paginate
   */
  handlePageUpdate = page => {
    this.setState(
      state => {
        return {
          query: { ...state.query, page: page.selected },
        };
      },
      () => {
        this.updateTable(this.state.query);
        localStorage.setItem(`${window.USER_ID}SaraPage`, JSON.stringify(page));
      }
    );
  };

  /**
   * Called when the number of entries to be shown on a page changes.
   * Updates state and then calls table update handler.
   * @param {SyntheticEvent} event - Event when num entries changes
   */
  handleEntriesChange = event => {
    localStorage.removeItem(`${window.USER_ID}SaraPage`);
    const value = event?.target?.value || event;
    this.setState(
      state => {
        return {
          query: { ...state.query, entries: value, page: 0 },
        };
      },
      () => {
        this.updateTable(this.state.query);
        localStorage.setItem(`${window.USER_ID}SaraEntries`, value);
      }
    );
  };

  handleChange = event => {
    localStorage.removeItem(`${window.USER_ID}SaraPage`);
    const form = this.state.form;
    const query = this.state.query;
    if (event.target.id === 'jurisdiction_path') {
      this.setState({ form: { ...form, jurisdiction_path: event.target.value } });
      const jurisdictionId = Object.keys(this.state.jurisdiction_paths).find(id => this.state.jurisdiction_paths[parseInt(id)] === event.target.value);
      if (jurisdictionId) {
        this.updateTable({ ...query, jurisdiction: jurisdictionId, page: 0 });
      }
    } else if (event.target.id === 'search') {
      this.updateTable({ ...query, search: event.target.value, page: 0 });
      localStorage.setItem(`${window.USER_ID}SaraSearch`, event.target.value);
    }
  };

  handleScopeChange(scope) {
    if (scope !== this.state.query.scope) {
      const query = this.state.query;
      this.updateTable({ ...query, scope, page: 0 });
    }
  }

  handleUserChange(user) {
    if (user !== this.state.query.user) {
      const form = this.state.form;
      const query = this.state.query;
      this.setState({ form: { ...form, assigned_user: '' } });
      this.updateTable({ ...query, user, page: 0 });
    }
  }

  handleKeyPress(event) {
    if (event.which === 13) {
      event.preventDefault();
    }
  }

  /**
   * Callback called when child Table component detects a selection change.
   * @param {Number[]} selectedRows - Array of selected row indices.
   */
  handleSelect = selectedRows => {
    // All rows are selected if the number selected is the max number shown or the total number of rows completely
    const selectAll = selectedRows.length >= this.state.query.entries || selectedRows.length >= this.state.table.totalRows;
    this.setState({
      actionsEnabled: selectedRows.length > 0,
      selectedPatients: selectedRows,
      selectAll,
    });
  };

  /**
   * Called when the edit button is clicked on a given row.
   * Updates the state to show the appropriate modal for editing a user and the the current row being edited.
   */
  handleEditClick = row => {
    // Reroute to the convert page
    window.location = `/patients/${this.state.table.rowData[parseInt(row)].id}/convert_potential_patient`;
  };

  updateTable = query => {
    // cancel any previous unfinished requests to prevent race condition inconsistencies
    this.state.cancelToken.cancel();

    // generate new cancel token for this request
    const cancelToken = axios.CancelToken.source();

    this.setState({ query, cancelToken, loading: true }, () => {
      this.queryServer(query);
    });
  };

  queryServer = _.debounce(query => {
    axios
      .post('/public_health/potential_patients', {
        workflow: this.props.workflow,
        ...query,
        filter: this.state.filter,
        cancelToken: this.state.cancelToken.token,
      })
      .catch(error => {
        if (!axios.isCancel(error)) {
          this.setState(state => {
            return {
              table: { ...state.table, rowData: [], totalRows: 0 },
              loading: false,
            };
          });
        }
      })
      .then(response => {
        if (response && response.data && response.data.linelist) {
          this.setState(state => {
            const displayedColData = this.state.table.colData.filter(colData => response.data.fields.includes(colData.field));
            return {
              table: { ...state.table, displayedColData, rowData: response.data.linelist, totalRows: response.data.total },
              selectedPatients: [],
              selectAll: false,
              loading: false,
              actionsEnabled: false,
              canEdit: response.data.editable,
            };
          });
        } else {
          this.setState({
            selectedPatients: [],
            selectAll: false,
            actionsEnabled: false,
            loading: false,
          });
        }
      });
  }, 500);

  updateJurisdictionPaths() {
    axios.get('/jurisdictions/paths').then(response => {
      this.setState({ jurisdiction_paths: response.data.jurisdiction_paths });
    });
  }

  formatTimestamp(timestamp) {
    const ts = moment.tz(timestamp, 'UTC');
    return ts.isValid() ? ts.tz(moment.tz.guess()).format('MM/DD/YYYY HH:mm z') : '';
  }

  formatDate(date) {
    return date ? moment(date, 'YYYY-MM-DD').format('MM/DD/YYYY') : '';
  }

  formatEndOfMonitoring(endOfMonitoring) {
    if (endOfMonitoring === 'Continuous Exposure') {
      return 'Continuous Exposure';
    }
    return moment(endOfMonitoring, 'YYYY-MM-DD').format('MM/DD/YYYY');
  }

  render() {
    return (
      <div className="mx-2 pb-4">
        <Nav variant="tabs" activeKey={this.state.query.tab}>
          {Object.entries(this.props.tabs).map(([tab, tabProps]) => {
            return (
              <Nav.Item key={tab} className={tab === 'all' ? 'ml-auto' : ''}>
                <Nav.Link eventKey={tab} onSelect={this.handleTabSelect} id={`${tab}_tab`}>
                  {tabProps.label}
                  <Badge variant={tabProps.variant} className="badge-larger-font ml-1">
                    <span>{`${tab}Count` in this.state ? this.state[`${tab}Count`] : ''}</span>
                  </Badge>
                </Nav.Link>
              </Nav.Item>
            );
          })}
        </Nav>
        <TabContent>
          <Card>
            <Card.Body className="pl-4 pr-4">
              <Row>
                <Col md="18">
                  <div className="lead mt-1 mb-3">
                    {this.props.tabs[this.state.query.tab].description} You are currently in the <u>{this.props.workflow}</u> workflow.
                    {this.props.tabs[this.state.query.tab].tooltip && (
                      <InfoTooltip tooltipTextKey={this.props.tabs[this.state.query.tab].tooltip} location="right"></InfoTooltip>
                    )}
                  </div>
                </Col>
              </Row>
              <Form className="my-1">
                <Form.Row className="align-items-center">
                  {this.state.query.tab !== 'transferred_out' && (
                    <React.Fragment>
                      <Col lg={17} md={15} className="my-1">
                        <InputGroup size="sm">
                          <InputGroup.Prepend>
                            <InputGroup.Text className="rounded-0">
                              <i className="fas fa-map-marked-alt"></i>
                              <span className="ml-1">Jurisdiction</span>
                            </InputGroup.Text>
                          </InputGroup.Prepend>
                          <Form.Control
                            aria-label="jurisdictions"
                            type="text"
                            autoComplete="off"
                            id="jurisdiction_path"
                            list="jurisdiction_paths"
                            value={this.state.form.jurisdiction_path}
                            onChange={this.handleChange}
                          />
                          <datalist id="jurisdiction_paths">
                            {Object.entries(this.state.jurisdiction_paths).map(([id, path]) => {
                              return (
                                <option value={path} key={id}>
                                  {path}
                                </option>
                              );
                            })}
                          </datalist>
                          <OverlayTrigger overlay={<Tooltip>Include Sub-Jurisdictions</Tooltip>}>
                            <Button
                              id="allJurisdictions"
                              size="sm"
                              variant={this.state.query.scope === 'all' ? 'primary' : 'outline-secondary'}
                              style={{ outline: 'none', boxShadow: 'none' }}
                              onClick={() => this.handleScopeChange('all')}>
                              All
                            </Button>
                          </OverlayTrigger>
                          <OverlayTrigger overlay={<Tooltip>Exclude Sub-Jurisdictions</Tooltip>}>
                            <Button
                              id="exactJurisdiction"
                              size="sm"
                              variant={this.state.query.scope === 'exact' ? 'primary' : 'outline-secondary'}
                              style={{ outline: 'none', boxShadow: 'none' }}
                              onClick={() => this.handleScopeChange('exact')}>
                              Exact
                            </Button>
                          </OverlayTrigger>
                        </InputGroup>
                      </Col>
                    </React.Fragment>
                  )}
                </Form.Row>
                <InputGroup size="sm" className="d-flex justify-content-between">
                  <InputGroup.Prepend>
                    <OverlayTrigger overlay={<Tooltip>Search by monitoree name, date of birth, state/local id, cdc id, or nndss/case id</Tooltip>}>
                      <InputGroup.Text className="rounded-0">
                        <i className="fas fa-search"></i>
                        <span className="ml-1">Search</span>
                      </InputGroup.Text>
                    </OverlayTrigger>
                  </InputGroup.Prepend>
                  <Form.Control
                    aria-label="search"
                    autoComplete="off"
                    size="sm"
                    id="search"
                    value={this.state.query.search}
                    onChange={this.handleChange}
                    onKeyPress={this.handleKeyPress}
                  />
                </InputGroup>
              </Form>
              <CustomTable
                columnData={this.state.table.displayedColData}
                rowData={this.state.table.rowData}
                totalRows={this.state.table.totalRows}
                handleTableUpdate={query => this.updateTable({ ...this.state.query, order: query.orderBy, page: query.page, direction: query.sortDirection })}
                handleSelect={this.handleSelect}
                handleEntriesChange={this.handleEntriesChange}
                isEditable={this.state.canEdit}
                handleEdit={this.handleEditClick}
                editTitle={'Convert'}
                isLoading={this.state.loading}
                page={this.state.query.page}
                handlePageUpdate={this.handlePageUpdate}
                selectedRows={this.state.selectedPatients}
                selectAll={this.state.selectAll}
                entryOptions={this.state.entryOptions}
                entries={parseInt(this.state.query.entries)}
              />
            </Card.Body>
          </Card>
        </TabContent>
      </div>
    );
  }
}

PatientsTable.propTypes = {
  authenticity_token: PropTypes.string,
  jurisdiction: PropTypes.exact({
    id: PropTypes.number,
    path: PropTypes.string,
  }),
  workflow: PropTypes.oneOf(['self_enrolled']),
  tabs: PropTypes.object,
};

export default PatientsTable;
