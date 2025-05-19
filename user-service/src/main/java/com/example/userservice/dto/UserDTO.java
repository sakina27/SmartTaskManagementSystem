package com.example.userservice.dto;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private String id;
    private String name;
    private String email;
    private String password;  // Only for registration (not returned in login response)
    private String jwtToken;  // Only populated during login

    // Constructor for login response (without password and jwtToken)
    public UserDTO(String id, String name, String email, String jwtToken) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.jwtToken = jwtToken;
    }

    // Constructor for registration response (without jwtToken)
    public UserDTO(String id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }
}
