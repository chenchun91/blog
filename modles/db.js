var settings = require('../settings'),
    Db = require('mongodb').Db,
    Connection = require('mongodb').Connection,
    Server = require('mongodb').Server;
	//�������ݿ��������ݿ��ַ�����ݿ�˿ڴ�����һ�����ݿ�����ʵ��
    module.exports = new Db(settings.db
	, new Server(settings.host, settings.port), {safe: true});