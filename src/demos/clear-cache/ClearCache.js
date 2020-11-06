import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { clearCaches } from '../../core/getApi';


function ClearCache({areYouSure}) {
    console.log(`ClearCache(${areYouSure})`);

    let ccResult;
    if (areYouSure === 'Y')
    {
        clearCaches();
        ccResult = <b style={{ color: 'orange' }}>Cleared!</b>;
    } else ccResult = <span style={{ color: 'gray' }}>Inactive</span>;

    // {/* <div className={classes.root}> */}
    return (
        <div className="Fred">
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
