Object.defineProperties(Array.prototype, {
    $toCastList: {
        enumerable: false,
        value: function(args) {
            let ret_list = [];
            
            for (let i=0; i<this.length; i++) {
                let row = this[i];

                let temp_row = {};
                for ( var j in args ) {
                    let args_key = args[j];
                    temp_row[args_key] = row[args_key];
                }
                ret_list.push(temp_row);    
            }

            return ret_list;
        }
    },
    /**
     * Map<key,List<Object>> 을 리턴
     * {
     *  pk: [{rowObject}, {rowObject}], 
     *  pk: [{rowObject}, {rowObject}], 
     *  pk: [{rowObject}, {rowObject}], 
     * }
     * 
     * pk_list = list.get(pk);
     */
    $toMapList: {
        enumerable: false,
        value: function(pk, args) {
            let retMap = new Map();
            
            for (let i=0; i<this.length; i++) {
                let row = this[i];
                let rowKey = row[pk];

                let row_list = retMap.get(rowKey);
                if ( row_list == undefined ) {
                    row_list = new Array();
                    retMap.set(rowKey, row_list);
                }

                if ( args == undefined ) {
                    row_list.push(row);
                }
                else {
                    let temp_row = {};
                    for ( var j in args ) {
                        let args_key = args[j];
                        temp_row[args_key] = row[args_key];
                    }
                    row_list.push(temp_row);
                }
            }

            return retMap;
        }
    },
    /**
     * Map<key,Object> 을 리턴
     * {
     *  pk: {rowObject}, 
     *  pk: {rowObject}, 
     *  pk: {rowObject}, 
     * }
     * 
     * pk_list = list.get(pk);
     */
    $toMap : {
        enumerable: false,
        value: function(pk, args) {
            let retMap = new Map();
            
            for (let i=0; i<this.length; i++) {
                let row = this[i];
                let rowKey = row[pk];
                if ( args == undefined ) {
                    retMap.set(rowKey, row);
                }
                else {
                    let temp_row = {};
                    for ( var j in args ) {
                        let args_key = args[j];
                        temp_row[args_key] = row[args_key];
                    }
                    retMap.set(rowKey, temp_row);
                }
            }

            return retMap;
        }
    },
});

module.exports = true;