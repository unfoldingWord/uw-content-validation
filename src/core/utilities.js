// utilities

// import { isUndefined } from 'lodash';


export function consoleLogObject(clTitle, clObject) {
    // Print an object's componenets to the console
    // Note: the following line succeeds even if length and/or size are undefined
    let clOutput = `cLO: ${clTitle} ${typeof clObject} (length=${clObject.length}) (size=${clObject.size}):\n`;
    for (const clPropertyName in clObject) {
        // console.log("   ", clTitle, clPropertyName); // for debugging only!
        let thisPropertyContents = "" + clObject[clPropertyName];
        if (thisPropertyContents.length > 50)
            thisPropertyContents = "(" + thisPropertyContents.length + ") " + thisPropertyContents.substring(0, 50) + "…";
        let oType = typeof clObject[clPropertyName];
        // From https://stackoverflow.com/questions/12996871/why-does-typeof-array-with-objects-return-object-and-not-array#12996879
        if (oType === "object" && Object.prototype.toString.call(clObject[clPropertyName]) === "[object Array]")
            oType = "array";
        clOutput += "  " + clPropertyName + " (type=" + oType + ")";
        let oLength;
        try { oLength = clObject[clPropertyName].length; }
        catch (olError) { oLength = "null" }
        if (oLength !== undefined) clOutput += " (length=" + oLength + ")";
        if (thisPropertyContents !== undefined) clOutput += ": " + thisPropertyContents + "\n";
    }
    console.log(clOutput);
}
// end of consoleLogObject function


export function displayPropertyNames(givenTitle, givenObject) {
    let output = "dPN: " + givenTitle + " " + (typeof givenObject) + ":\n";
    for (const propertyName in givenObject)
        output += "  " + propertyName + " (type=" + typeof givenObject[propertyName] + ")\n";
    console.log(output);
}
// end of displayPropertyNames function


export function ourParseInt(givenString) {
    /*
    The regular parseInt() function is too forgiving

    See https://stackoverflow.com/questions/1133770/how-to-convert-a-string-to-an-integer-in-javascript

    This one throws an error if the entire field doesn't give an integer.
    */

    /* First attempt
    const int1 = parseInt(givenString, 10); // Don't let the function guess the base (if the string has a leading zero)
    const int2 = givenString * 1; // This one is less forgiving it seems
    if (int1!==int2) console.log(`From '${givenString}' we got ${int1} (${typeof int1}) and ${int2} (${typeof int2})`)
    if (isNaN(int2) || isNaN(int1)
    || int2===undefined || int1==undefined
    || int2!==int1)
        throw "String is not a simple integer";
    return int1;
    */

    // Optimised version
    const int = givenString * 1; // This one is less forgiving it seems
    if (isNaN(int)) throw "String is not a simple integer";
    return int;
}


/*
// function to convert an array to an object
// with keys being 0..n
export const array_to_obj = ( ar => {
  const ob = {};
  Object.assign(ob,ar);
  return ob;
});

// function to convert map to object
export const map_to_obj = ( mp => {
  const ob = {};
  mp.forEach((v,k) => {ob[k]=v});
  return ob;
});

// function to convert object to a map
export const obj_to_map = ( ob => {
  const mp = new Map();
  Object.keys ( ob ).forEach (k => { mp.set(k, ob[k]) });
  return mp;
});

// function to convert word frequency map
// to an object suitable for MaterialTable
export const wf_to_mt = ( ob => {
  const mt = {};
  mt.title = "Word Frequency";
  mt.columns = [
      { title: "Word", field: "word" },
      { title: "Count", field: "check" },
  ];
  mt.data = [];
  Object.keys(ob).forEach ( w => {
      mt.data.push({ word: w, check: ob[w] })
  })

  mt.options = { sorting: true, exportButton: true };

  return mt;
});

// function to convert an array of words to
// an object suitable for MaterialTable
export const aw_to_mt = ( ar => {
  // first convert array to object
  const ob = array_to_obj(ar);
  const mt = {};
  mt.title = "All Words in Text Order";
  mt.columns = [
      { title: "Order", field: "order" , type: "numeric"},
      { title: "Word", field: "word" },
  ];
  mt.data = [];
  Object.keys(ob).forEach ( n => {
      mt.data.push({ order: n, word: ob[n] })
  });

  mt.options = { sorting: true };

  return mt;
});
*/
