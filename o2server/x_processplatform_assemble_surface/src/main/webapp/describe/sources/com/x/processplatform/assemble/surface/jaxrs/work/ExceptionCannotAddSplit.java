package com.x.processplatform.assemble.surface.jaxrs.work;

import com.x.base.core.project.exception.PromptException;

class ExceptionCannotAddSplit extends PromptException {

	private static final long serialVersionUID = -3439770681867963457L;

	ExceptionCannotAddSplit(String id) {
		super("工作: {}, 当前状态不可增加分支.", id);
	}
}
