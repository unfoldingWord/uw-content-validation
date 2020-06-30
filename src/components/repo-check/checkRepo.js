const CHECKER_VERSION_STRING = '0.0.1';

function checkRepo(repoObject, givenLocation, checkingOptions) {
    console.log("I'm here in checkRepo v" + CHECKER_VERSION_STRING);
    console.log("  with "+repoObject.full_name+", " + givenLocation+", "+JSON.stringify(checkingOptions));

    const ourLocation = ' in ' + repoObject.full_name + givenLocation;

    let checkRepoResult = { successList:[], noticeList:[] };


    return checkRepoResult;
};
// end of checkRepo()

export default checkRepo;
