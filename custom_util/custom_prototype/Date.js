Object.defineProperties(Date.prototype, {
    $getDateFormat : {
        enumerable: false,
        value: function(glue) {
            glue = (typeof glue !== 'undefined') ? glue : '';
            return this.getFullYear().$padStart(4,0) + glue + (this.getMonth()+1).$padStart(2,0) + glue + this.getDate().$padStart(2,0);
        }
    },
    $getTimeFormat : {
        enumerable: false,
        value: function(glue) {
            glue = (typeof glue !== 'undefined') ? glue : '';
            return this.getHours().$padStart(2,0) + glue + this.getMinutes().$padStart(2,0) + glue + this.getSeconds().$padStart(2,0);
        }
    },
    $isBiggerThan : {
        enumerable: false,
        value: function (date) {
            let now = Math.floor(this.getTime() / 1000);
            return now >= date.$toTimestamp();
        }
    },
    $addSeconds : {
        enumerable: false,
        value: function (seconds) {
            return new Date(this.getTime() + (seconds * 1000));
        }
    },
    $addDays : {
        enumerable: false,
        value: function (days) {
            let ret_date = new Date(this);
            return new Date(ret_date.setDate(this.getDate() + days));
        }
    }
});

