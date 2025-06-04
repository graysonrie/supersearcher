export function truncateText(text:string, maxLen:number){
    const prefix = '..';
    if(text.length <= maxLen)
        return text;
    return `${prefix}${text.substring(text.length - maxLen,text.length)}`;
}