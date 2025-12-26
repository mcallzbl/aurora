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
@Schema(description = "照片")
public class PhotoVO {

    @NotNull(message = "相册id不能为空")
    @Schema(description = "相册id", requiredMode = Schema.RequiredMode.REQUIRED)
    private Integer albumId;

    @Schema(description = "照片列表", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<String> photoUrls;

    @Schema(description = "照片id列表", requiredMode = Schema.RequiredMode.REQUIRED)
    private List<Integer> photoIds;

}
