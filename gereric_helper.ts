// Iterates a function is an error is found
// args are the function arguments. Pass as many as you need but be sure to pass them in the right order as the function requires.
export async function iterateIfErr(numIterate: number, myfunc: (...args:any[]) => Promise<any>, ...args: Array<any>){
    try{
        await myfunc(...args);
    } catch(err){
        if(!(numIterate-1)) throw err;
        console.log("Encountered an error in function ",myfunc.name, ". Trying again");
        await iterateIfErr((numIterate-1), myfunc,...args);
        iterateIfErr((numIterate-1), myfunc,...args);
    }
}

/* if element is found, returns the index of the element in the array
Otherwise, returns false */
export function findElementIndex(array, elem) {
    for (let i = 0; i < array.length; i++) {
      if (array[i].title == elem) {
        return i;
      }
    }
    return false;
  }

// // Verifies object info // Isn't being used at the moment
// function guard(s: object): s is ListingInfo {
//   return true;
// }
