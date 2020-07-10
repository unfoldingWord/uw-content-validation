// utilities


export function consoleLogObject(given_title, givenObject) {
    let output = given_title + ' object:\n';
    // for (let propertyName in givenObject)
    //     output += "  " + propertyName + '\n';
    for (let propertyName in givenObject) {
        //try {
        let thisPropertyContents = '' + givenObject[propertyName];
        if (thisPropertyContents.length > 50)
            thisPropertyContents = '(' + thisPropertyContents.length + ') ' + thisPropertyContents.substring(0, 50) + '…';
        output += '  ' + propertyName + ' (type=' + typeof givenObject[propertyName] + '): ' + thisPropertyContents + '\n';
        /*}
        catch (e) {
          console.log("Can't parse " + propertyName);
        }*/
    }
    console.log(output);
}
// end of consoleLogObject function


export function displayPropertyNames(given_title, givenObject) {
    let output = given_title + " " + typeof givenObject + ":\n";
    for (let propertyName in givenObject) {
        output += '  ' + propertyName + ' (type=' + typeof givenObject[propertyName] + ')\n';
    }
    console.log(output);
}
// end of displayPropertyNames function


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
      { title: 'Word', field: 'word' },
      { title: 'Count', field: 'check' },
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
      { title: 'Order', field: 'order' , type: 'numeric'},
      { title: 'Word', field: 'word' },
  ];
  mt.data = [];
  Object.keys(ob).forEach ( n => {
      mt.data.push({ order: n, word: ob[n] })
  });

  mt.options = { sorting: true };

  return mt;
});
*/
