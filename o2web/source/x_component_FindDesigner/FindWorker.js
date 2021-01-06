var _worker = self;
var _action = {
    _checkRequest: function(s,f){
        if (this.request.readyState === XMLHttpRequest.DONE) {
            if (this.request.status === 200) {
                this._doneRequest(s);
            } else {
                this._errorRequest(f);
            }
        }
    },
    _createRequest: function(s, f){
        var request = new XMLHttpRequest();
        request.addEventListener("readystatechange",function(){
            if (this.readyState === XMLHttpRequest.DONE) {
                if (this.status === 200) {
                    var json = JSON.parse(this.responseText);
                    var xToken = this.getResponseHeader("x-token");
                    if (xToken){
                        json.xToken = xToken;
                    }
                    if (s) s(json);
                } else {
                    if (f) f(this, this.responseText);
                }
            }
        });
        return request
    },
    sendRequest: function(data){
        return new Promise(function(s, f){
            var request = this._createRequest(s, f);
            var method = data.method;
            var noCache = !!data.noCache;
            var async = !!data.loadAsync;
            var withCredentials = !!data.credentials;
            var url = data.address;
            var body = data.body;
            var debug = data.debug;
            var token = data.token;

            if (noCache) url = url+(((url.indexOf("?")!==-1) ? "&" : "?")+(new Date()).getTime());

            request.open(method, url, async);

            request.withCredentials = withCredentials;
            request.setRequestHeader("Content-Type", "application/json; charset=utf-8");
            request.setRequestHeader("Accept", "text/html,application/json,*/*");
            if (debug) request.setRequestHeader("x-debugger", "true");
            if (token){
                request.setRequestHeader("x-token", token);
                request.setRequestHeader("authorization", token);
            }

            request.send(body);
        }.bind(this));
    },

    _doneRequest: function(s){
        var json = JSON.parse(this.request.responseText);
        var xToken = this.request.getResponseHeader("x-token");
        if (xToken){
            json.xToken = xToken;
        }
        if (s) s(json);
        // _worker.postMessage({"type": "done", "data": json});
        // _worker.close();
    },
    _errorRequest: function(f){
        if (s) s(this.request, this.request.responseText);
        // _worker.postMessage({"type":"error", "data": {"status":  this.request.status, "statusText":  this.request.statusText, "responseText":this.request.responseText}});
        // _worker.close();
    }
};

_worker.action = _action;

_worker._receiveMessageReply = function(){
    _worker.postMessage({
        "type": "receive"
    });
};
_worker._readyMessageReply = function(){
    _worker.postMessage({
        "type": "ready",
        "count": this.filterOptionList.length
    });
};

_worker._getRequestOption = function(data, par){
    if (par){
        Object.keys(par).forEach(function(k){
            data.url = data.url.replace("{"+k+"}", par[k]);
        });
    }
    return {
        "method": data.method||"get",
        "noCache": false,
        "loadAsync": true,
        "credentials": true,
        "address": data.url,
        "body": data.body || "",
        "debug": data.debug || _worker.findData.debug,
        "token": data.token || _worker.findData.token
    };
};

_worker._createFilterOption = function(moduleType, appId, designerType, desingerId){
    var filterOption = JSON.parse(_worker.filterOptionTemplete);
    filterOption.moduleList.push({
        "moduleType": moduleType,
        "moduleAppList": [{"appId": appId, "designerList": [{"designerType": designerType, "designerIdList": [desingerId]}]}]
    });
    this.filterOptionList.push(filterOption);
    return filterOption;
};
_worker._getDesingerModule = function(id, restful, par, moduleType, designerType){
    var p = _worker.action.sendRequest(_worker._getRequestOption({"url": restful, "debug": _worker.findData.debug, "token": _worker.findData.token }, par));
    return p.then(function(json){
        list = json.data;
        list.forEach(function(designer){
            _worker._createFilterOption(moduleType, id, designerType, designer.id)
        });
    }, function(){});
};

_worker._getDesinger_processPlatform = function(id){
    var promiseArr = [];
    if (_worker.findData.filterOption.designerTypes.indexOf("script")!=-1){    //所有脚本
        promiseArr.push(_worker._getDesingerModule(id, _worker.findData.actions.listProcessScript, {"applicationId": id}, "processPlatform", "script"));
    }
    if (_worker.findData.filterOption.designerTypes.indexOf("form")!=-1){      //所有表单
        promiseArr.push(_worker._getDesingerModule(id, _worker.findData.actions.listProcessForm, {"applicationId": id}, "processPlatform", "form"));
    }
    if (_worker.findData.filterOption.designerTypes.indexOf("process")!=-1){   //所有流程
        promiseArr.push(_worker._getDesingerModule(id, _worker.findData.actions.listProcessProcess, {"applicationId": id}, "processPlatform", "process"));
    }
    return promiseArr;
};

_worker._getDesinger_cms = function(id){
    var promiseArr = [];
    if (_worker.findData.filterOption.designerTypes.indexOf("script")!=-1){    //所有脚本
        promiseArr.push(_worker._getDesingerModule(id, _worker.findData.actions.listCmsScript, {"flag": id}, "cms", "script"));
    }
    if (_worker.findData.filterOption.designerTypes.indexOf("form")!=-1){      //所有表单
        promiseArr.push(_worker._getDesingerModule(id, _worker.findData.actions.listCmsForm, {"appId": id}, "cms", "form"));
    }
    return promiseArr;
};

_worker._getDesinger_portal = function(id){
    var promiseArr = [];
    if (_worker.findData.filterOption.designerTypes.indexOf("script")!=-1){    //所有脚本
        promiseArr.push(_worker._getDesingerModule(id, _worker.findData.actions.listPortalScript, {"portalId": id}, "portal", "script"));
    }
    if (_worker.findData.filterOption.designerTypes.indexOf("page")!=-1){      //所有表单
        promiseArr.push(_worker._getDesingerModule(id, _worker.findData.actions.listPortalPage, {"portalId": id}, "portal", "page"));
    }
    if (_worker.findData.filterOption.designerTypes.indexOf("widget")!=-1){   //所有流程
        promiseArr.push(_worker._getDesingerModule(id, _worker.findData.actions.listPortalWidget, {"portalId": id}, "portal", "widget"));
    }
    return promiseArr;
};

_worker._getDesinger_query = function(id){
    var promiseArr = [];
    if (_worker.findData.filterOption.designerTypes.indexOf("view")!=-1){    //所有脚本
        promiseArr.push(_worker._getDesingerModule(id, _worker.findData.actions.listQueryView, {"flag": id}, "query", "view"));
    }
    if (_worker.findData.filterOption.designerTypes.indexOf("stat")!=-1){      //所有表单
        promiseArr.push(_worker._getDesingerModule(id, _worker.findData.actions.listQueryStat, {"flag": id}, "query", "stat"));
    }
    if (_worker.findData.filterOption.designerTypes.indexOf("statement")!=-1){   //所有流程
        promiseArr.push(_worker._getDesingerModule(id, _worker.findData.actions.listQueryStatement, {"flag": id}, "query", "statement"));
    }
    return promiseArr;
};

_worker._getDesinger_service = function(id){
    var promiseArr = [];
    if (_worker.findData.filterOption.designerTypes.indexOf("script")!=-1){    //所有脚本
        if (id=="invoke"){
            promiseArr.push(_worker._getDesingerModule(id, _worker.findData.actions.listInvoke, null, "service", "script"));
        }else{
            promiseArr.push(_worker._getDesingerModule(id, _worker.findData.actions.listAgent, null, "service", "script"));
        }
    }
    return promiseArr;
};


_worker._listApplication = function(type){
    switch (type){
        case "processPlatform":
            return this.action.sendRequest(_worker._getRequestOption({"url": this.findData.actions.listProcess, "debug": this.findData.debug, "token": this.findData.token }));
        case "cms":
            return this.action.sendRequest(_worker._getRequestOption({"url": this.findData.actions.listCms, "debug": this.findData.debug, "token": this.findData.token }));
        case "portal":
            return this.action.sendRequest(_worker._getRequestOption({"url": this.findData.actions.listPortal, "debug": this.findData.debug, "token": this.findData.token }));
        case "query":
            return this.action.sendRequest(_worker._getRequestOption({"url": this.findData.actions.listQuery, "debug": this.findData.debug, "token": this.findData.token }));
    }

};
_worker._parseFindModule = function(moduleList){
    var promiseArr = [];
    moduleList.forEach(function(module){
        if (module.moduleType==="service"){
            if (!module.flagList || !module.flagList.length){

                var filterOption = JSON.parse(_worker.filterOptionTemplete);
                filterOption.moduleList.push({
                    "moduleType": module.moduleType,
                    "moduleAppList": [{"appId": "invoke"}]
                });
                this.filterOptionList.push(filterOption);

                var filterOption = JSON.parse(_worker.filterOptionTemplete);
                filterOption.moduleList.push({
                    "moduleType": module.moduleType,
                    "moduleAppList": [{"appId": "agent"}]
                });
                this.filterOptionList.push(filterOption);

                //promiseArr.push(Promise.resolve(""));
                promiseArr = promiseArr.concat(_worker["_getDesinger_"+module.moduleType]("invoke"));
                promiseArr = promiseArr.concat(_worker["_getDesinger_"+module.moduleType]("agent"));
            }else{
                module.flagList.forEach(function(flag){
                    if (!flag.designerList || !flag.designerList.length){
                        promiseArr = promiseArr.concat(_worker["_getDesinger_"+module.moduleType](flag.id));
                    }else{
                        flag.designerList.forEach(function(designer){
                            var filterOption = _worker._createFilterOption(module.moduleType, flag.id, designer.designerType, designer.id)
                            promiseArr = promiseArr.concat(Promise.resolve(filterOption));
                        });
                    }
                });
            }
        }else{
            if (!module.flagList || !module.flagList.length){
                var p = _worker._listApplication(module.moduleType);
                promiseArr.push(p.then(function(json){

                    // json.data.forEach(function(app){
                    //     var filterOption = JSON.parse(_worker.filterOptionTemplete);
                    //     filterOption.moduleList.push({
                    //         "moduleType": module.moduleType,
                    //         "moduleAppList": [{"appId": app.id}]
                    //     });
                    //     this.filterOptionList.push(filterOption);
                    // });
                    // return Promise.resolve("");
                    //临时处理


                    var pArr = [];
                    json.data.forEach(function(app){
                        pArr = pArr.concat(_worker["_getDesinger_"+module.moduleType](app.id));
                    });
                    return Promise.all(pArr);
                }, function(){}));

            }else{
                module.flagList.forEach(function(flag){
                    if (!flag.designerList || !flag.designerList.length){
                        promiseArr = promiseArr.concat(_worker["_getDesinger_"+module.moduleType](flag.id));
                    }else{
                        flag.designerList.forEach(function(designer){
                            var filterOption = _worker._createFilterOption(module.moduleType, flag.id, designer.designerType, designer.id)
                            promiseArr = promiseArr.concat(Promise.resolve(filterOption));
                        });
                    }
                });
            }
        }
    }.bind(this));
    return promiseArr;
}

_worker._findMessageReply = function(data, option){
    _worker.setTimeout(function(){
        _worker.postMessage({
            "type": "find",
            "data": data,
            "option": option
        });
    }, 200);
};
_worker._findOptionReply = function(){
    _worker.postMessage({
        "type": "done"
    });
};



_worker._createFindMessageReplyData = function(module, designer, aliase, pattern){
    return {
        "module": module,
        "appId": designer.appId,
        "appName": designer.appName,
        "designerId": designer.designerId,
        "designerName": designer.designerName,
        "designerType": designer.designerType,
        "designerAliase": aliase,

        "pattern": pattern
    };
};

_worker._setFilterOptionRegex = function(){
    var keyword = _worker.findData.filterOption.keyword;
    if (_worker.findData.filterOption.matchRegExp){
        var flag = (_worker.findData.filterOption.caseSensitive) ? "g" : "gi";
        this.keywordRegexp =  new RegExp(keyword, flag);
    }else{
        var flag = (_worker.findData.filterOption.caseSensitive) ? "g" : "gi";
        keyword = (_worker.findData.filterOption.matchWholeWord) ? "\\b"+keyword+"\\b" : keyword;
        this.keywordRegexp = new RegExp(keyword, flag);
    }
};

_worker._findProcessPlatformParse_script = function(designer, option){
    if (designer.patternList && designer.patternList.length){
        var action = this.findData.actions.getProcessScript;

        var p = _worker.action.sendRequest(_worker._getRequestOption({"url": action}, {"id": designer.designerId}));
        p.then(function(json){
            designer.patternList.forEach(function(pattern){
                if (pattern.property=="text"){
                    var scriptLines = json.data.text.split(/\n/);
                    pattern.lines.forEach(function(line){
                        var scriptText = scriptLines[line-1];
                        while ((arr = this.keywordRegexp.exec(scriptText)) !== null) {
                            var col = arr.index;
                            var key = arr[0];
                            var value = arr.input;
                            _worker._findMessageReply(_worker._createFindMessageReplyData("processPlatform", designer, json.data.aliase, {
                                "property": pattern.property,
                                "value": value,
                                "line": line,
                                "column": col,
                                "key": key
                            }), option);
                        }
                    });
                }else{
                    _worker._findMessageReply(_worker._createFindMessageReplyData("processPlatform", designer, json.data.aliase, {
                        "property": pattern.property,
                        "value": json.data[pattern.property]
                    }), option);
                }
            });
        }, function(){});
    }
};

_worker._findProcessPlatformParse_form = function(designer){

};

_worker._findProcessPlatformParse_process = function(designer){

};

_worker._findProcessPlatformParse = function(resultList, option){
    resultList.forEach(function(designer){
        switch (designer.designerType){
            case "script":
                _worker._findProcessPlatformParse_script(designer, option);
                break;
            case "form":
                _worker._findProcessPlatformParse_form(designer, option);
                break;
            case "process":
                _worker._findProcessPlatformParse_process(designer, option);
                break;
        }
    });
};


_worker._doFindDesigner = function(option, idx){

    var option = this.filterOptionList[idx];

        var res = _worker._getRequestOption({
            "method": "post",
            "url": this.findData.actions.findAction,
            "body": JSON.stringify(option),
            "debug": this.findData.debug,
            "token": this.findData.token
        });
        this.action.sendRequest(res).then(function(json){
            if (json.data.processPlatformList && json.data.processPlatformList.length){

                // var worker = new Worker("../x_component_FindDesigner/PatternWorker.js");
                // worker.onmessage = function(e) {
                //     if (e.data) _worker._findMessageReply(e.data, option);
                // }.bind(this);
                // worker.postMessage({
                //     "parser": "_findProcessPlatformParse",
                //     "actions": _worker.findData.actions,
                //     "option": option,
                //     "pattern": json.data.processPlatformList
                // });

               _worker._findProcessPlatformParse(json.data.processPlatformList, option);
            }
            if (json.data.cmsList && json.data.cmsList.length){

            }
            if (json.data.portalList && json.data.portalList.length){

            }
            if (json.data.queryList && json.data.queryList.length){

            }
            if (json.data.serviceList && json.data.serviceList.length){

            }
            _worker._findOptionReply();

            idx++;
            if (this.filterOptionList.length>idx)  _worker._doFindDesigner(null, idx);
            //this.filterOptionList[idx];

            //_worker._findMessageReply(json.data, option);
        }, function(xhr){
            _worker._findOptionReply(null);
            _worker._findMessageReply(null);

            idx++;
            if (this.filterOptionList.length>idx)  _worker._doFindDesigner(null, idx);
        });



},

_worker._doFindDesignerFromFilterOption = function(){
    var idx = 0;
    //this.filterOptionList.forEach(function(option){
    //    _worker._doFindDesigner(option, idx);
    //});

    _worker._doFindDesigner(null, idx);
},
onmessage = function(e) {
    this.findData = e.data;
    var moduleList = this.findData.filterOption.moduleList;
    this.findData.filterOption.moduleList = [];
    _worker._setFilterOptionRegex();

    this.filterOptionTemplete = JSON.stringify(this.findData.filterOption);
    this.filterOptionList = [];

    Promise.all(_worker._parseFindModule(moduleList)).then(function(){
        // this.filterOptionList[0].moduleList=[];
        // //_worker._doFindDesigner(this.filterOptionList[0]);
        // this.filterOptionList = [this.filterOptionList[0]];
        _worker._readyMessageReply();
        _worker._doFindDesignerFromFilterOption();
    });

    //"moduleType": "cms", "flagList": [];
    // designerTypes
    // flagList = [{
    //     "id": "dddd",
    //     "desingerList": [
    //         {
    //             "desingerType": "脚本(script)表单(form)流程(process)页面(page)部件(widget)视图(view)脚本(statement)统计(stat",
    //             "id": ""
    //         },
    //         {
    //             "desingerType": "脚本(script)表单(form)流程(process)页面(page)部件(widget)视图(view)脚本(statement)统计(stat",
    //             "id": ""
    //         }
    //     ]
    // }]




    _worker._receiveMessageReply();



    //_worker.action.sendRequest(e.data);
}
