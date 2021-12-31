import { BigInt } from "@graphprotocol/graph-ts";

export function findItemIndex (arr:string[], value:string):number {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === value) {
      return i
    }
  }
  return -1
}

export function removeItems(array:string[], items:string[]):string[]{
    var i = 0;
    let id=0
    while (i < items.length) {
        let index = array.indexOf(items[i]);        
        for (let t = 0; t < array.length; t++) {
            if (array[t] === items[i]) {
                id = t;
            }
        }
  
        if (id > -1) {
            array.splice(index, 1);
        }
        i++;
    }
    return array;
  }
  

