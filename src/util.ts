import dns from 'dns';
import { promisify } from 'util';

export const dnsLookup = promisify(dns.lookup);
