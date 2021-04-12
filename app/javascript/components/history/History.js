import React from 'react';
import { PropTypes } from 'prop-types';
import { Card } from 'react-bootstrap';
import moment from 'moment-timezone';

import { time_ago_in_words } from './helpers';

const history = ({ history }) => {
  return (
    <div>
      <a className="anchor" id={`comment_${history.id}`}></a>
      <Card id={`comment_${history.id}`} className="card-square mt-4 mx-3 shadow-sm">
        <Card.Header>
          <b>{history.created_by}</b>, {time_ago_in_words(moment(history.created_at).toDate())} ago (
          {moment
            .tz(history.created_at, 'UTC')
            .tz(moment.tz.guess())
            .format('YYYY-MM-DD HH:mm z')}
          )
          <span className="float-right">
            <div className="badge-padding h5">
              <span className="badge badge-secondary">{history.history_type}</span>
            </div>
          </span>
        </Card.Header>
        <Card.Body>
          <Card.Text>{history.comment}</Card.Text>
        </Card.Body>
      </Card>
    </div>
  );
};

history.propTypes = {
  history: PropTypes.object,
};

export default history;
