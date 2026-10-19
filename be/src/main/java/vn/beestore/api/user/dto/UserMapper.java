package vn.beestore.api.user.dto;

import org.mapstruct.Mapper;
import vn.beestore.api.user.domain.User;

@Mapper
public interface UserMapper {

    UserDto toDto(User user);
}
