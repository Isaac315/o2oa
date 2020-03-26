package com.x.okr.assemble.control.jaxrs.okrauthorize.exception;

import com.x.base.core.project.exception.PromptException;

public class ExceptionPersonNotExists extends PromptException {

	private static final long serialVersionUID = 1859164370743532895L;

	public ExceptionPersonNotExists( String name ) {
		super("人员不存在。Person:" + name );
	}
}
