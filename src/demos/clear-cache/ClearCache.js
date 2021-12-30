import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { clearCaches } from '../../core/getApi';
import { userLog } from '../../core/utilities';


function ClearCache({areYouSure}) {
    userLog(`ClearCache(${areYouSure})`);

    let ccResult;
    if (areYouSure === 'Y')
    {
        clearCaches();
        ccResult = <b style={{ color: 'orange' }}>Cleared stored caches!</b>;
    } else ccResult = <span style={{ color: 'gray' }}>Inactive</span>;

    // {/* <div className={classes.root}> */}
    return (
        <div className="mainDiv">
        {ccResult}
        </div>
    );
}

// BookPackagesCheck.propTypes = {
//   /** @ignore */
//   username: PropTypes.object.isRequired,
//   /** @ignore */
//   languageCode: PropTypes.object.isRequired,
//   bookIDs: PropTypes.object.isRequired,
//   props: PropTypes.object,
// };

const styles = theme => ({
  root: {
  },
});

export default withStyles(styles)(ClearCache);
