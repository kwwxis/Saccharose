import morgan from 'morgan';
import { Request, Response } from '../../util/router';

const logSkipRegex: RegExp = /\.css|\.js|\.png|\.svg|\.ico|\.jpg|\.woff|\.env/g;

morgan.token('date', function(){
  return new Date().toLocaleString('en-US', {timeZone: 'America/Los_Angeles'});
});

morgan.token('url', (req: Request) => decodeURI(req.originalUrl || req.url));
morgan.token('inputLanguage', (req: Request) => req.cookies['inputLangCode'] || 'EN');
morgan.token('outputLanguage', (req: Request) => req.cookies['outputLangCode'] || 'EN');

export default morgan('[:date[web] PST] [:inputLanguage::outputLanguage] :status :method :url (:response-time ms)', {
  skip: function(req: Request, res: Response) {
    return res.statusCode === 304 || logSkipRegex.test(req.url);
  }
});