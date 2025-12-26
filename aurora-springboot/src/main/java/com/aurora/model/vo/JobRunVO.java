package com.aurora.model.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobRunVO {

    @Schema(description = "id", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer id;

    @Schema(description = "jobGroup", requiredMode = Schema.RequiredMode.REQUIRED)
    private String jobGroup;
}
