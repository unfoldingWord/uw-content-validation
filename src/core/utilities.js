// utilities

export function display_object(given_title, given_object) {
    let output = given_title + ' object:\n';
    // for (let property_name in given_object)
    //     output += "  " + property_name + '\n';
    for (let property_name in given_object) {
      //try {
      let this_property_contents = '' + given_object[property_name];
      if (this_property_contents.length > 50)
        this_property_contents = '(' + this_property_contents.length + ') ' + this_property_contents.substring(0, 50) + '…';
      output += '  ' + property_name + ': ' + this_property_contents + '\n';
      /*}
      catch (e) {
        console.log("Can't parse " + property_name);
      }*/
    }
    console.log(output);
  }
  // end of display_object function

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
