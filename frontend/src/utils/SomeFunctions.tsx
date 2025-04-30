import { Timestamp } from "firebase/firestore";

export const timestampToString = (timestamp: Timestamp | null | undefined, now: number | undefined=undefined, includeDate=false, includeTime=false) => {
    let str = '';
    const timestampDate = new Date((timestamp?.seconds ?? 0)*1000);
    if (typeof now == 'number') {
        let diff = now - (timestamp?.seconds ?? 0)*1000;

        if (diff < 60000) {
            str += `${Math.floor(diff / 1000)} ${Math.floor(diff / 1000) == 1 ? 'second': 'seconds'} ago`;
        } else if (diff < 3600000) {
            str += `${Math.floor(diff / 60000)} ${Math.floor(diff / 60000) == 1 ? 'minute': 'minutes'} ago`;
        } else if (diff < 86400000) {
            str += `${Math.floor(diff / 3600000)} ${Math.floor(diff / 3600000) == 1 ? 'hour': 'hours'} ago`;
        } else if (diff < 604800000) {
            str += `${Math.floor(diff / 86400000)} ${Math.floor(diff / 86400000) == 1 ? 'day': 'days'} ago`;
        } else if (diff < 2629756800) {
            str += `${Math.floor(diff / 604800000)} ${Math.floor(diff / 604800000) == 1 ? 'week': 'weeks'} ago`;
        } else if (diff < 31556952000) {
            str += `${Math.floor(diff / 2629756800)} ${Math.floor(diff / 2629756800) == 1 ? 'month' : 'months'} ago`;
        } else {
            str += `${Math.floor(diff / 31556952000)} ${Math.floor(diff / 31556952000) == 1 ? 'year' : 'years'} ago`;
//            str += `${diff} milliseconds ago`;
        }
    }
    
    if (includeDate) {
        if (typeof now == 'number') str += ' - ';
        str += timestampDate.toLocaleDateString();
    }

    if (includeTime) {
        if (str.length > 0) str += ' at ';
        str += timestampDate.toLocaleTimeString();
    }

    return str;
}

export function uriFrom(uri: string | null | undefined) {
    if (typeof uri === 'string' && uri !== '') return {uri: uri};
    return undefined;
}

export function truncateText(text: string, maxLength: number, lineBreak=true) {
    if (text.length <= maxLength) {
      return text;
    }
    return text.slice(0, maxLength) + "...";
  }
  