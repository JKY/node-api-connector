var express = require('express'),
    should = require('chai').should(),
    expect = require('chai').expect,
    assert = require('chai').assert,
    request = require('supertest'),
    guard = require('../').guard,
    fs = require('fs');

describe('should libaray for frontend return',function(done){
    var app = null;
    var mock = null;

    before(function(done){
         var app =  express();
         var g = new guard({
                PACKAGE_HOME: __dirname + '/package',
                /* api 配置 */
                api: {
                    use: function(appid, callback) {
                        callback(null, {
                            'store': true,
                            'wx_conf': true,
                            'wx_oauth': true,
                            'wx_pay': true
                        });
                    },
                    conf: {
                        get: function(appid, config, callback) {
                            for(var key in config){
                                if(key == 'appid'){
                                     config['appid'] = 'wx50d746e9d0f0af1d';//'wx22fb445469f289a2';
                                }
                            }
                            callback(null, config);
                        }
                    },
                    data: {
                        save: function(appid, apiname, data,callback){
                            console.log('==== data ====');
                            console.log(appid + ':' + apiname);
                            console.log(data);
                            callback(null,null);
                        }
                    },
                    called: function(appid,apiname,ip,refer){
                       
                    }
                },
                data: function(appid,apiname,data,callback){
                    callback(null);
                }
            });
            app.use(g.proxy);
            mock = app.listen(2998); 
            done();
    });


    after(function(done) {
        mock.close(done);
    });


    it('/mkit.js', function(done) {
        request(mock)
          .get('/mkit.js')
          .expect(200)
          .end(function(err, res) {
                if (err) 
                    return done(err);
                done();
          });
    });


    it('/{appid}/fn.js', function(done) {
        request(mock)
          .get('/foo/fn.js')
          .expect(200)
          .end(function(err, res) {
                if (err) 
                    return done(err);
                done();
          });
    });

    describe('proxying should return json without err',function(done){
        it('/{appid}/endpoint/wx_conf', function(done) {
            request(mock)
              .get('/foo/endpoint/wx_conf')
              .expect(200)
              .end(function(err, res) {
                    if (err) 
                        return done(err);
                    var o = JSON.parse(res.text);
                    if(o.err == null){
                        done();   
                    }else{
                        done(new Error('return with error:' + o.err)); 
                    }
              });
        });
    });


    describe('should return the enabled api list',function(done){
        it('/api/list', function(done) {
            request(mock)
              .get('/api/list')
              .expect(200)
              .end(function(err, res) {
                    if (err) 
                        return done(err);
                    var o = JSON.parse(res.text);
                    o.should.be.an('array');
                    done();
              });
        });
    });




    describe('should return the api detail json by the giveing name',function(done){
        it('/api/{apiname}', function(done) {
            request(mock)
              .get('/api/wx_conf')
              .expect(200)
              .end(function(err, res) {
                    if (err) 
                        return done(err);
                    var o = JSON.parse(res.text);
                    assert.equal(o.err,null);
                    expect(o.result.name).to.equal('wx_conf');
                    done();
              });
        });
    });



    describe('should return the markdown text of the api by the giveing name',function(done){
        it('/api/{apiname}/doc', function(done) {
            request(mock)
              .get('/api/wx_conf/doc')
              .expect(200)
              .end(function(err, res) {
                    if (err) 
                        return done(err);
                    expect(res.text).to.be.a('string');
                    done();
              });
        });
    });




    describe('should return config json of the api by the giveing name',function(done){
        it('/{uid}/{appid}/{apiname}/conf', function(done) {
            request(mock)
              .get('/uid/appid/wx_conf/conf')
              .expect(200)
              .end(function(err, res) {
                    if (err) 
                        return done(err);
                    var o = JSON.parse(res.text);
                    assert.equal(o.err,null);
                    done();
              });
        });
    });
});