import React from 'react';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';

class BadgeCC extends React.Component {
  render() {
    return (
      <React.Fragment>
        <span data-for={`${this.props.patientId}-cc`} data-tip="" className={this.props.customClass}>
          <i className="fas fa-child"></i>
        </span>
        <ReactTooltip id={`${this.props.patientId}-cc`} multiline={true} place={this.props.location} type="dark" effect="solid" className="tooltip-container">
          <span>Monitoree has close contacts that have not been enrolled.</span>
        </ReactTooltip>
      </React.Fragment>
    );
  }
}

BadgeCC.propTypes = {
  patientId: PropTypes.string,
  customClass: PropTypes.string,
  location: PropTypes.string,
};

export default BadgeCC;
