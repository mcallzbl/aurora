package com.aurora.model.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Schema(description = "审核")
public class ReviewVO {

    @NotNull(message = "id不能为空")
    @Schema(description = "id列表", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<Integer> ids;

    @NotNull(message = "状态值不能为空")
    @Schema(description = "删除状态", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer isReview;

}
